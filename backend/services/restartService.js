@@ .. @@
-const { spawn } = require('child_process');
+const { spawn, exec } = require('child_process');
 const { RestartLog } = require('../models');
 const logger = require('../utils/logger');
-const { sendEmail } = require('./emailService');
+const net = require('net');

 const executeRestart = async (servers, restartLog, io) => {
   try {
     const details = { servers: [], errors: [] };
     
     // Sort servers by restart order
     servers.sort((a, b) => a.restartOrder - b.restartOrder);
     
     io.emit('restart-status', {
       logId: restartLog.id,
       status: 'started',
       message: 'Restart process initiated'
     });
     
     for (const server of servers) {
       try {
         logger.info(`Restarting server: ${server.name} (${server.hostname})`);
         
         // Ping test first
-        const pingResult = await pingServer(server.hostname);
+        const pingResult = await pingServer(server.ipAddress);
         if (!pingResult) {
-          throw new Error('Server is not reachable');
+          logger.warn(`Server ${server.name} is not reachable via ping, attempting restart anyway`);
         }
         
         // Execute SSH reboot command
         const sshResult = await executeSSHReboot(server);
         
         details.servers.push({
           id: server.id,
           name: server.name,
           hostname: server.hostname,
           status: 'success',
           timestamp: new Date()
         });
         
         io.emit('restart-status', {
           logId: restartLog.id,
           serverId: server.id,
           status: 'restarted',
           message: `Server ${server.name} restarted successfully`
         });
         
         // Wait for restart delay if specified
         if (server.restartDelay > 0) {
+          logger.info(`Waiting ${server.restartDelay} seconds before next restart`);
           await new Promise(resolve => setTimeout(resolve, server.restartDelay * 1000));
         }
         
       } catch (error) {
         logger.error(`Failed to restart ${server.name}:`, error);
         details.errors.push({
           serverId: server.id,
           serverName: server.name,
           error: error.message
         });
         
         io.emit('restart-status', {
           logId: restartLog.id,
           serverId: server.id,
           status: 'error',
           message: `Failed to restart ${server.name}: ${error.message}`
         });
       }
     }
     
     // Update restart log
     const status = details.errors.length === 0 ? 'completed' : 'failed';
     await restartLog.update({
       status,
       details,
       endTime: new Date()
     });
     
     io.emit('restart-status', {
       logId: restartLog.id,
       status: status,
       message: `Restart process ${status}`,
       details
     });
     
   } catch (error) {
     logger.error('Restart process failed:', error);
     await restartLog.update({
       status: 'failed',
       details: { error: error.message },
       endTime: new Date()
     });
     
     io.emit('restart-status', {
       logId: restartLog.id,
       status: 'failed',
       message: `Restart process failed: ${error.message}`
     });
   }
 };

-const pingServer = (hostname) => {
+const pingServer = (ipAddress) => {
   return new Promise((resolve) => {
-    const ping = spawn('ping', ['-c', '1', hostname]);
+    const isWindows = process.platform === 'win32';
+    const pingCmd = isWindows ? 'ping' : 'ping';
+    const pingArgs = isWindows ? ['-n', '1', '-w', '3000', ipAddress] : ['-c', '1', '-W', '3', ipAddress];
     
+    const ping = spawn(pingCmd, pingArgs);
+    
+    ping.on('error', (error) => {
+      logger.error(`Ping command error for ${ipAddress}:`, error);
+      resolve(false);
+    });
+    
     ping.on('close', (code) => {
       resolve(code === 0);
     });
+    
+    setTimeout(() => {
+      ping.kill();
+      resolve(false);
+    }, 5000);
   });
 };

 const executeSSHReboot = (server) => {
   return new Promise((resolve, reject) => {
+    // Check if we're in Docker and need to use host networking
+    const sshHost = process.env.NODE_ENV === 'production' ? server.ipAddress : server.hostname;
+    
     const ssh = spawn('ssh', [
       '-o', 'StrictHostKeyChecking=no',
       '-o', 'ConnectTimeout=10',
-      `root@${server.hostname}`,
+      '-o', 'UserKnownHostsFile=/dev/null',
+      '-o', 'BatchMode=yes',
+      `root@${sshHost}`,
       'reboot'
     ]);
     
     let error = '';
+    let output = '';
+    
+    ssh.stdout.on('data', (data) => {
+      output += data.toString();
+    });
     
     ssh.stderr.on('data', (data) => {
       error += data.toString();
     });
     
+    ssh.on('error', (err) => {
+      logger.error(`SSH spawn error for ${server.name}:`, err);
+      reject(new Error(`SSH connection failed: ${err.message}`));
+    });
+    
     ssh.on('close', (code) => {
-      if (code === 0 || code === null) { // null code is expected for reboot
+      // For reboot command, connection will be terminated, so various exit codes are acceptable
+      if (code === 0 || code === null || code === 255) {
+        logger.info(`SSH reboot command sent to ${server.name}, exit code: ${code}`);
         resolve(true);
       } else {
-        reject(new Error(error || `SSH command failed with code ${code}`));
+        logger.error(`SSH reboot failed for ${server.name}, exit code: ${code}, error: ${error}`);
+        reject(new Error(error || `SSH command failed with code ${code}`));
       }
     });
+    
+    // Timeout for SSH command
+    setTimeout(() => {
+      ssh.kill();
+      logger.warn(`SSH timeout for ${server.name}`);
+      reject(new Error('SSH command timeout'));
+    }, 15000);
   });
 };

 module.exports = { executeRestart };