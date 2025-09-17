const express = require('express');
const { Server, RestartLog, MonitorLog, ScheduledTask, User } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// Get dashboard statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const [
      totalServers,
      onlineServers,
      offlineServers,
      pendingTasks,
      recentActions,
      avgResponseTime
    ] = await Promise.all([
      Server.count({ where: { isActive: true } }),
      Server.count({ where: { isActive: true, status: 'online' } }),
      Server.count({ where: { isActive: true, status: 'offline' } }),
      ScheduledTask.count({ where: { status: 'pending' } }),
      RestartLog.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      }),
      MonitorLog.findOne({
        attributes: [
          [require('sequelize').fn('AVG', require('sequelize').col('responseTime')), 'avgTime']
        ],
        where: {
          createdAt: {
            [Op.gte]: new Date(Date.now() - 60 * 60 * 1000)
          }
        }
      })
    ]);

    res.json({
      totalServers,
      onlineServers,
      offlineServers,
      pendingTasks,
      recentActions,
      averageResponseTime: Math.round(avgResponseTime?.dataValues?.avgTime || 0)
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get recent activity
router.get('/activity', authenticateToken, async (req, res) => {
  try {
    const restartLogs = await RestartLog.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: [{ model: User, attributes: ['username'] }]
    });

    const activity = restartLogs.map(log => ({
      id: `restart-${log.id}`,
      action: log.isScheduled ? 'Scheduled restart' : 'Manual restart',
      serverName: `${log.serverIds.length} server(s)`,
      timestamp: log.createdAt,
      status: log.status === 'completed' ? 'success' : log.status,
      user: log.User?.username || 'System'
    }));

    res.json(activity);
  } catch (error) {
    console.error('Dashboard activity error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;