@@ .. @@
-const { spawn } = require('child_process');
+const { spawn, exec } = require('child_process');
 const { Server, MonitorLog } = require('../models');
 const logger = require('../utils/logger');
 const { sendAlertEmail } = require('./emailService');

 let monitoringInterval;

 const startMonitoring = (io) => {
   logger.info('Starting server monitoring service');
   
   // Monitor every minute
   monitoringInterval = setInterval(async () => {
     await monitorAllServers(io);
   }, 60000);
   
   // Initial monitoring
   monitorAllServers(io);
 };

 const stopMonitoring = () => {
   if (monitoringInterval) {
     clearInterval(monitoringInterval);
     logger.info('Monitoring service stopped');
   }
 };

 const monitorAllServers = async (io) => {
   try {
     const servers = await Server.findAll({ where: { isActive: true } });
     
     for (const server of servers) {
       const startTime = Date.now();
       
-      const pingResult = await pingServer(server.hostname);
-      const telnetResult = await telnetServer(server.ipAddress, server.port);
+      const pingResult = await pingServer(server.ipAddress);
+      const telnetResult = await telnetServer(server.ipAddress, server.port);
       const responseTime = Date.now() - startTime;
       
       // Determine overall status
       const isOnline = pingResult && telnetResult;
       const previousStatus = server.status;
       const newStatus = isOnline ? 'online' : 'offline';
       
       // Update server status
       await server.update({
         status: newStatus,
         lastPing: pingResult ? new Date() : server.lastPing,
         lastTelnet: telnetResult ? new Date() : server.lastTelnet
       });
       
       // Log monitoring result
       await MonitorLog.create({
         serverId: server.id,
         pingStatus: pingResult,
         telnetStatus: telnetResult,
-        responseTime
+        responseTime,
+        errorMessage: !isOnline ? `Ping: ${pingResult}, Telnet: ${telnetResult}` : null
       });
       
       // Send alert if server went offline
       if (previousStatus === 'online' && newStatus === 'offline') {
         await sendAlertEmail(server, 'Server is offline');
       }
       
       // Emit real-time update
       io.emit('server-status', {
         serverId: server.id,
         status: newStatus,
         pingStatus: pingResult,
         telnetStatus: telnetResult,
         responseTime,
         timestamp: new Date()
       });
     }
   } catch (error) {
     logger.error('Monitoring error:', error);
   }
 };

-const pingServer = (hostname) => {
+const pingServer = (ipAddress) => {
   return new Promise((resolve) => {
-    const ping = spawn('ping', ['-c', '1', '-W', '5', hostname]);
+    // Use different ping command based on OS
+    const isWindows = process.platform === 'win32';
+    const pingCmd = isWindows ? 'ping' : 'ping';
+    const pingArgs = isWindows ? ['-n', '1', '-w', '5000', ipAddress] : ['-c', '1', '-W', '5', ipAddress];
     
+    const ping = spawn(pingCmd, pingArgs);
+    
+    let output = '';
+    ping.stdout.on('data', (data) => {
+      output += data.toString();
+    });
+    
+    ping.stderr.on('data', (data) => {
+      logger.error(`Ping error for ${ipAddress}:`, data.toString());
+    });
+    
     ping.on('close', (code) => {
-      resolve(code === 0);
+      const success = code === 0;
+      if (!success) {
+        logger.warn(`Ping failed for ${ipAddress}, exit code: ${code}`);
+      }
+      resolve(success);
     });
     
+    ping.on('error', (error) => {
+      logger.error(`Ping spawn error for ${ipAddress}:`, error);
+      resolve(false);
+    });
+    
     setTimeout(() => {
       ping.kill();
+      logger.warn(`Ping timeout for ${ipAddress}`);
       resolve(false);
     }, 10000);
   });
 };

 const telnetServer = (host, port) => {
   return new Promise((resolve) => {
-    const netcat = spawn('nc', ['-z', '-v', '-w', '5', host, port.toString()]);
+    // Try different approaches for telnet check
+    const timeout = 5000;
+    
+    // First try with netcat
+    const nc = spawn('nc', ['-z', '-w', '5', host, port.toString()]);
     
-    netcat.on('close', (code) => {
-      resolve(code === 0);
+    nc.on('close', (code) => {
+      if (code === 0) {
+        resolve(true);
+      } else {
+        // Fallback to telnet or timeout approach
+        tryTelnetFallback(host, port, resolve);
+      }
+    });
+    
+    nc.on('error', () => {
+      // Netcat not available, try fallback
+      tryTelnetFallback(host, port, resolve);
     });
     
     setTimeout(() => {
-      netcat.kill();
+      nc.kill();
       resolve(false);
-    }, 10000);
+    }, timeout);
   });
 };

+const tryTelnetFallback = (host, port, resolve) => {
+  // Use Node.js net module as fallback
+  const net = require('net');
+  const socket = new net.Socket();
+  
+  const timeout = setTimeout(() => {
+    socket.destroy();
+    resolve(false);
+  }, 5000);
+  
+  socket.connect(port, host, () => {
+    clearTimeout(timeout);
+    socket.destroy();
+    resolve(true);
+  });
+  
+  socket.on('error', () => {
+    clearTimeout(timeout);
+    resolve(false);
+  });
+};
+
 module.exports = { startMonitoring, stopMonitoring, monitorAllServers };