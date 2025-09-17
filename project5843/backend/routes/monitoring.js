const express = require('express');
const { Server, MonitorLog } = require('../models');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get server status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const servers = await Server.findAll({
      include: [{
        model: MonitorLog,
        limit: 1,
        order: [['createdAt', 'DESC']]
      }]
    });
    
    res.json(servers);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get monitoring history for a server
router.get('/history/:serverId', authenticateToken, async (req, res) => {
  try {
    const { serverId } = req.params;
    const { limit = 100 } = req.query;
    
    const logs = await MonitorLog.findAll({
      where: { serverId },
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']],
      include: [{ model: Server, attributes: ['name', 'hostname'] }]
    });
    
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;