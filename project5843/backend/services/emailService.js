const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendAlertEmail = async (server, message) => {
  try {
    // Get admin emails from environment or database
    const adminEmails = process.env.ADMIN_EMAILS ? 
      process.env.ADMIN_EMAILS.split(',') : 
      ['admin@company.com'];
    
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: adminEmails.join(','),
      subject: `🚨 Server Alert: ${server.name}`,
      html: `
        <h2>Server Alert</h2>
        <p><strong>Server:</strong> ${server.name} (${server.hostname})</p>
        <p><strong>IP Address:</strong> ${server.ipAddress}</p>
        <p><strong>Status:</strong> ${message}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <p>Please check the server monitoring dashboard for more details.</p>
      `
    };
    
    await transporter.sendMail(mailOptions);
    logger.info(`Alert email sent for server ${server.name}`);
  } catch (error) {
    logger.error('Failed to send alert email:', error);
  }
};

const sendScheduledRestartNotification = async (task, emails) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: emails.join(','),
      subject: `🔄 Scheduled Server Restart: ${task.name}`,
      html: `
        <h2>Scheduled Server Restart</h2>
        <p><strong>Task:</strong> ${task.name}</p>
        <p><strong>Scheduled Time:</strong> ${new Date(task.scheduledTime).toLocaleString()}</p>
        <p><strong>Servers:</strong> ${task.serverIds.length} server(s)</p>
        <p>The scheduled server restart has been initiated.</p>
      `
    };
    
    await transporter.sendMail(mailOptions);
    logger.info(`Scheduled restart notification sent for task ${task.name}`);
  } catch (error) {
    logger.error('Failed to send scheduled restart notification:', error);
  }
};

module.exports = { sendAlertEmail, sendScheduledRestartNotification };