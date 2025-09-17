@@ .. @@
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     
     if (formData.serverIds.length === 0) {
       toast.error('Please select at least one server');
       return;
     }
     
+    // Validate scheduled time is in the future
+    const scheduledTime = new Date(formData.scheduledTime);
+    const now = new Date();
+    
+    if (scheduledTime <= now) {
+      toast.error('Scheduled time must be in the future');
+      return;
+    }
+    
     try {
       const taskData = {
         ...formData,
+        scheduledTime: scheduledTime.toISOString(),
         notificationEmails: formData.emailNotification 
           ? formData.notificationEmails.filter(email => email.trim() !== '')
           : []
       };
       
       await schedulerAPI.createTask(taskData);
       toast.success('Task scheduled successfully');
       loadData();
       resetForm();
     } catch (error) {
       toast.error('Failed to schedule task');
     }
   };

   const resetForm = () => {
     setShowModal(false);
     setFormData({
       name: '',
       serverIds: [],
-      scheduledTime: '',
+      scheduledTime: new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16), // Default to 1 hour from now
       emailNotification: false,
       notificationEmails: ['']
     });
   };