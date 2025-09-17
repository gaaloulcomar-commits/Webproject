@@ .. @@
 const express = require('express');
 const { RestartLog, MonitorLog, User, Server } = require('../models');
 const { authenticateToken } = require('../middleware/auth');
+const { Parser } = require('json2csv');

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

+// Export monitor logs to CSV
+router.get('/monitor/export', authenticateToken, async (req, res) => {
+  try {
+    const { serverId, days = 7 } = req.query;
+    
+    const whereClause = {
+      createdAt: {
+        [require('sequelize').Op.gte]: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
+      }
+    };
+    
+    if (serverId) {
+      whereClause.serverId = serverId;
+    }
+    
+    const logs = await MonitorLog.findAll({
+      where: whereClause,
+      order: [['createdAt', 'DESC']],
+      include: [{ 
+        model: Server, 
+        attributes: ['name', 'hostname', 'ipAddress', 'port'] 
+      }]
+    });
+    
+    const csvData = logs.map(log => ({
+      'Server Name': log.Server?.name || 'Unknown',
+      'Hostname': log.Server?.hostname || 'N/A',
+      'IP Address': log.Server?.ipAddress || 'N/A',
+      'Port': log.Server?.port || 'N/A',
+      'Ping Status': log.pingStatus ? 'Success' : 'Failed',
+      'Telnet Status': log.telnetStatus ? 'Success' : 'Failed',
+      'Response Time (ms)': log.responseTime || 0,
+      'Error Message': log.errorMessage || '',
+      'Timestamp': log.createdAt.toISOString()
+    }));
+    
+    const parser = new Parser();
+    const csv = parser.parse(csvData);
+    
+    const filename = `assurnet-monitoring-${new Date().toISOString().split('T')[0]}.csv`;
+    
+    res.setHeader('Content-Type', 'text/csv');
+    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
+    res.send(csv);
+    
+  } catch (error) {
+    console.error('Export error:', error);
+    res.status(500).json({ error: 'Export failed' });
+  }
+});

 module.exports = router;