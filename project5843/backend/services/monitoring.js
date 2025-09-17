const { spawn } = require('child_process');
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
      
      const pingResult = await pingServer(server.hostname);
      const telnetResult = await telnetServer(server.ipAddress, server.port);
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
        responseTime
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

const pingServer = (hostname) => {
  return new Promise((resolve) => {
    const ping = spawn('ping', ['-c', '1', '-W', '5', hostname]);
    
    ping.on('close', (code) => {
      resolve(code === 0);
    });
    
    setTimeout(() => {
      ping.kill();
      resolve(false);
    }, 10000);
  });
};

const telnetServer = (host, port) => {
  return new Promise((resolve) => {
    const netcat = spawn('nc', ['-z', '-v', '-w', '5', host, port.toString()]);
    
    netcat.on('close', (code) => {
      resolve(code === 0);
    });
    
    setTimeout(() => {
      netcat.kill();
      resolve(false);
    }, 10000);
  });
};

module.exports = { startMonitoring, stopMonitoring, monitorAllServers };