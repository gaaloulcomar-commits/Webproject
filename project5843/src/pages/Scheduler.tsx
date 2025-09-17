import React, { useState, useEffect } from 'react';
import { schedulerAPI, serversAPI } from '../services/api';
import { Calendar, Plus, X, Clock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

interface ScheduledTask {
  id: number;
  name: string;
  serverIds: number[];
  scheduledTime: string;
  status: string;
  emailNotification: boolean;
  notificationEmails: string[];
  User: {
    username: string;
  };
}

interface Server {
  id: number;
  name: string;
  hostname: string;
}

const Scheduler: React.FC = () => {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    serverIds: [] as number[],
    scheduledTime: '',
    emailNotification: false,
    notificationEmails: ['']
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tasksData, serversData] = await Promise.all([
        schedulerAPI.getTasks(),
        serversAPI.getAll()
      ]);
      
      setTasks(tasksData);
      setServers(serversData.filter((s: Server) => s.isActive));
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.serverIds.length === 0) {
      toast.error('Please select at least one server');
      return;
    }
    
    try {
      const taskData = {
        ...formData,
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

  const handleCancel = async (taskId: number) => {
    if (!confirm('Are you sure you want to cancel this task?')) return;
    
    try {
      await schedulerAPI.cancelTask(taskId);
      toast.success('Task cancelled successfully');
      loadData();
    } catch (error) {
      toast.error('Failed to cancel task');
    }
  };

  const resetForm = () => {
    setShowModal(false);
    setFormData({
      name: '',
      serverIds: [],
      scheduledTime: '',
      emailNotification: false,
      notificationEmails: ['']
    });
  };

  const addEmailField = () => {
    setFormData(prev => ({
      ...prev,
      notificationEmails: [...prev.notificationEmails, '']
    }));
  };

  const removeEmailField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      notificationEmails: prev.notificationEmails.filter((_, i) => i !== index)
    }));
  };

  const updateEmail = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      notificationEmails: prev.notificationEmails.map((email, i) => 
        i === index ? value : email
      )
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-900/20 text-green-400';
      case 'failed':
        return 'bg-red-900/20 text-red-400';
      case 'cancelled':
        return 'bg-gray-900/20 text-gray-400';
      default:
        return 'bg-yellow-900/20 text-yellow-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Scheduler</h1>
          <p className="text-gray-400">Schedule server restart tasks</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} className="mr-2" />
          Schedule Task
        </button>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <Calendar className="mr-2" size={20} />
            Scheduled Tasks ({tasks.length})
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-6 text-gray-400 font-medium">Task Name</th>
                <th className="text-left py-3 px-6 text-gray-400 font-medium">Servers</th>
                <th className="text-left py-3 px-6 text-gray-400 font-medium">Scheduled Time</th>
                <th className="text-left py-3 px-6 text-gray-400 font-medium">Status</th>
                <th className="text-left py-3 px-6 text-gray-400 font-medium">Created By</th>
                <th className="text-left py-3 px-6 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="border-b border-gray-700 hover:bg-gray-750 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center">
                      <div>
                        <div className="text-white font-medium">{task.name}</div>
                        {task.emailNotification && (
                          <div className="flex items-center mt-1">
                            <Mail size={12} className="text-blue-400 mr-1" />
                            <span className="text-xs text-blue-400">Email notifications</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-300">
                    {task.serverIds.length} server{task.serverIds.length !== 1 ? 's' : ''}
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-gray-300">
                      {new Date(task.scheduledTime).toLocaleString()}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                      {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-300">
                    {task.User?.username || 'System'}
                  </td>
                  <td className="py-4 px-6">
                    {task.status === 'pending' && (
                      <button
                        onClick={() => handleCancel(task.id)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 px-6 text-center text-gray-400">
                    No scheduled tasks
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-white mb-4">Schedule New Task</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">
                  Task Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Weekly server restart"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">
                  Scheduled Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Select Servers
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {servers.map((server) => (
                    <label
                      key={server.id}
                      className="flex items-center space-x-2 p-2 bg-gray-700 rounded cursor-pointer hover:bg-gray-600"
                    >
                      <input
                        type="checkbox"
                        checked={formData.serverIds.includes(server.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              serverIds: [...prev.serverIds, server.id]
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              serverIds: prev.serverIds.filter(id => id !== server.id)
                            }));
                          }
                        }}
                        className="text-blue-600"
                      />
                      <div>
                        <div className="text-white text-sm font-medium">{server.name}</div>
                        <div className="text-gray-400 text-xs">{server.hostname}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.emailNotification}
                    onChange={(e) => setFormData({ ...formData, emailNotification: e.target.checked })}
                    className="text-blue-600"
                  />
                  <span className="text-gray-300">Send email notifications</span>
                </label>
              </div>
              
              {formData.emailNotification && (
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Notification Emails
                  </label>
                  {formData.notificationEmails.map((email, index) => (
                    <div key={index} className="flex space-x-2 mb-2">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => updateEmail(index, e.target.value)}
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="email@example.com"
                      />
                      {formData.notificationEmails.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEmailField(index)}
                          className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addEmailField}
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    + Add email
                  </button>
                </div>
              )}
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Schedule Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scheduler;