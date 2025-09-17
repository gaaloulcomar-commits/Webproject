@@ .. @@
 export const usersAPI = {
   getAll: () => apiCall('/users'),
   update: (id: number, userData: any) => apiCall(`/users/${id}`, {
     method: 'PUT',
     body: JSON.stringify(userData),
   }),
 };

+export const groupsAPI = {
+  getAll: () => apiCall('/groups'),
+  create: (groupData: any) => apiCall('/groups', {
+    method: 'POST',
+    body: JSON.stringify(groupData),
+  }),
+};