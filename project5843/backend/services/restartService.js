const { spawn } = require('child_process');
const { RestartLog } = require('../models');
const logger = require('../utils/logger');
const { sendEmail } = require('./emailService');

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
        const pingResult = await pingServer(server.hostname);
        if (!pingResult) {
          throw new Error('Server is not reachable');
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

const pingServer = (hostname) => {
  return new Promise((resolve) => {
    const ping = spawn('ping', ['-c', '1', hostname]);
    
    ping.on('close', (code) => {
      resolve(code === 0);
    });
  });
};

const executeSSHReboot = (server) => {
  return new Promise((resolve, reject) => {
    const ssh = spawn('ssh', [
      '-o', 'StrictHostKeyChecking=no',
      '-o', 'ConnectTimeout=10',
      `root@${server.hostname}`,
      'reboot'
    ]);
    
    let error = '';
    
    ssh.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    ssh.on('close', (code) => {
      if (code === 0 || code === null) { // null code is expected for reboot
        resolve(true);
      } else {
        reject(new Error(error || `SSH command failed with code ${code}`));
      }
    });
  });
};

module.exports = { executeRestart };