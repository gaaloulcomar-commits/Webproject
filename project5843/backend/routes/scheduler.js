const express = require('express');
const { ScheduledTask, User } = require('../models');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { scheduleTask } = require('../services/scheduler');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Get scheduled tasks
router.get('/', authenticateToken, async (req, res) => {
  try {
    const tasks = await ScheduledTask.findAll({
      order: [['scheduledTime', 'ASC']],
      include: [{ 
        model: User, 
        attributes: ['username'] 
      }]
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Schedule a task
router.post('/', [
  authenticateToken,
  requirePermission('canScheduleTasks'),
  body('name').isLength({ min: 1 }).trim().escape(),
  body('serverIds').isArray({ min: 1 }),
  body('scheduledTime').isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const task = await ScheduledTask.create({
      ...req.body,
      createdBy: req.user.userId
    });
    
    // Schedule the task
    await scheduleTask(task);
    
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Cancel a task
router.delete('/:id', [
  authenticateToken,
  requirePermission('canScheduleTasks')
], async (req, res) => {
  try {
    const task = await ScheduledTask.findByPk(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    await task.update({ status: 'cancelled' });
    
    res.json({ message: 'Task cancelled successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;