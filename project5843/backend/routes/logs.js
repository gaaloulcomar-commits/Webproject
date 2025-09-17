const express = require('express');
const { RestartLog, MonitorLog, User, Server } = require('../models');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get restart logs
router.get('/restart', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const logs = await RestartLog.findAndCountAll({
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [['createdAt', 'DESC']],
      include: [{ 
        model: User, 
        attributes: ['username'] 
      }]
    });
    
    res.json({
      logs: logs.rows,
      total: logs.count,
      pages: Math.ceil(logs.count / parseInt(limit)),
      currentPage: parseInt(page)
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get monitor logs
router.get('/monitor', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 50, serverId } = req.query;
    
    const whereClause = serverId ? { serverId } : {};
    
    const logs = await MonitorLog.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [['createdAt', 'DESC']],
      include: [{ 
        model: Server, 
        attributes: ['name', 'hostname'] 
      }]
    });
    
    res.json({
      logs: logs.rows,
      total: logs.count,
      pages: Math.ceil(logs.count / parseInt(limit)),
      currentPage: parseInt(page)
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;