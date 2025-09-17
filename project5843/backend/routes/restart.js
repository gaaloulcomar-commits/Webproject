const express = require('express');
const { Server, RestartLog, User } = require('../models');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { executeRestart } = require('../services/restartService');

const router = express.Router();

// Restart servers
router.post('/', [
  authenticateToken,
  requirePermission('canRestart')
], async (req, res) => {
  try {
    const { serverIds } = req.body;
    
    if (!serverIds || !Array.isArray(serverIds) || serverIds.length === 0) {
      return res.status(400).json({ error: 'Server IDs are required' });
    }
    
    const servers = await Server.findAll({
      where: { id: serverIds, isActive: true }
    });
    
    if (servers.length === 0) {
      return res.status(404).json({ error: 'No active servers found' });
    }
    
    // Create restart log
    const restartLog = await RestartLog.create({
      userId: req.user.userId,
      serverIds: serverIds,
      status: 'started'
    });
    
    // Execute restart asynchronously
    executeRestart(servers, restartLog, req.app.get('io'));
    
    res.json({ 
      message: 'Restart initiated successfully',
      logId: restartLog.id
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;