const cron = require('node-cron');
const { ScheduledTask, Server } = require('../models');
const { executeRestart } = require('./restartService');
const { sendScheduledRestartNotification } = require('./emailService');
const logger = require('../utils/logger');

let io;
const scheduledJobs = new Map();

const initializeScheduler = (socketIo) => {
  io = socketIo;
  logger.info('Scheduler service initialized');
  
  // Load existing scheduled tasks
  loadScheduledTasks();
};

const loadScheduledTasks = async () => {
  try {
    const tasks = await ScheduledTask.findAll({
      where: { status: 'pending' }
    });
    
    for (const task of tasks) {
      await scheduleTask(task);
    }
    
    logger.info(`Loaded ${tasks.length} scheduled tasks`);
  } catch (error) {
    logger.error('Failed to load scheduled tasks:', error);
  }
};

const scheduleTask = async (task) => {
  try {
    const scheduledTime = new Date(task.scheduledTime);
    const now = new Date();
    
    if (scheduledTime <= now) {
      logger.warn(`Task ${task.id} is scheduled in the past, skipping`);
      await task.update({ status: 'failed' });
      return;
    }
    
    const delay = scheduledTime.getTime() - now.getTime();
    
    const jobId = setTimeout(async () => {
      await executeScheduledTask(task);
    }, delay);
    
    scheduledJobs.set(task.id, jobId);
    logger.info(`Task ${task.id} scheduled to run at ${scheduledTime}`);
    
  } catch (error) {
    logger.error(`Failed to schedule task ${task.id}:`, error);
  }
};

const executeScheduledTask = async (task) => {
  try {
    logger.info(`Executing scheduled task: ${task.name}`);
    
    // Get servers to restart
    const servers = await Server.findAll({
      where: { id: task.serverIds, isActive: true }
    });
    
    if (servers.length === 0) {
      logger.warn(`No active servers found for task ${task.id}`);
      await task.update({ status: 'failed' });
      return;
    }
    
    // Send notification email if enabled
    if (task.emailNotification && task.notificationEmails.length > 0) {
      await sendScheduledRestartNotification(task, task.notificationEmails);
    }
    
    // Create restart log for scheduled task
    const { RestartLog } = require('../models');
    const restartLog = await RestartLog.create({
      userId: task.createdBy,
      serverIds: task.serverIds,
      status: 'started',
      isScheduled: true
    });
    
    // Execute restart
    await executeRestart(servers, restartLog, io);
    
    // Update task status
    await task.update({ status: 'completed' });
    
    // Remove from scheduled jobs
    scheduledJobs.delete(task.id);
    
    logger.info(`Scheduled task ${task.name} completed successfully`);
    
  } catch (error) {
    logger.error(`Failed to execute scheduled task ${task.id}:`, error);
    await task.update({ status: 'failed' });
    scheduledJobs.delete(task.id);
  }
};

const cancelScheduledTask = async (taskId) => {
  const jobId = scheduledJobs.get(taskId);
  if (jobId) {
    clearTimeout(jobId);
    scheduledJobs.delete(taskId);
    logger.info(`Cancelled scheduled task ${taskId}`);
  }
};

module.exports = { 
  initializeScheduler, 
  scheduleTask, 
  cancelScheduledTask 
};