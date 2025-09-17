const express = require('express');
const { Server } = require('../models');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Get all groups
router.get('/', authenticateToken, async (req, res) => {
  try {
    const groups = await Server.findAll({
      attributes: ['group'],
      group: ['group'],
      raw: true
    });
    
    const groupList = groups.map(g => g.group).filter(Boolean);
    const uniqueGroups = [...new Set(groupList)];
    
    res.json(uniqueGroups.map(name => ({ name })));
  } catch (error) {
    console.error('Groups fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create group (by adding server with new group)
router.post('/', [
  authenticateToken,
  requirePermission('canManageServers'),
  body('name').isLength({ min: 1 }).trim().escape()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name } = req.body;
    
    // Check if group already exists
    const existingGroup = await Server.findOne({ where: { group: name } });
    if (existingGroup) {
      return res.status(400).json({ error: 'Group already exists' });
    }
    
    res.status(201).json({ name, message: 'Group name validated' });
  } catch (error) {
    console.error('Group creation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;