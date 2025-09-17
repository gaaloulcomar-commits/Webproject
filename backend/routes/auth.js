@@ .. @@
 // Register (Admin only)
-router.post('/register', [
+router.post('/register', [
+  authenticateToken,
+  requirePermission('canManageUsers'),
   body('username').isLength({ min: 3 }).trim().escape(),
   body('email').isEmail().normalizeEmail(),
   body('password').isLength({ min: 6 }),
 ], async (req, res) => {
   try {
     const errors = validationResult(req);
     if (!errors.isEmpty()) {
       return res.status(400).json({ errors: errors.array() });
     }

     const { username, email, password, role, permissions } = req.body;
     
     const existingUser = await User.findOne({
-      where: { $or: [{ username }, { email }] }
+      where: { 
+        [require('sequelize').Op.or]: [{ username }, { email }] 
+      }
     });
     
     if (existingUser) {
       return res.status(400).json({ error: 'User already exists' });
     }
     
     const hashedPassword = await bcrypt.hash(password, 12);
     
     const user = await User.create({
       username,
       email,
       password: hashedPassword,
       role: role || 'user',
       permissions: permissions || {}
     });
     
     res.status(201).json({ message: 'User created successfully', userId: user.id });
   } catch (error) {
+    console.error('Registration error:', error);
     res.status(500).json({ error: 'Server error' });
   }
 });