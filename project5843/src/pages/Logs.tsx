import React, { useState, useEffect } from 'react';
import { logsAPI } from '../services/api';
import { FileText, RotateCcw, Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface RestartLog {
  id: number;
  serverIds: number[];
  status: string;
  startTime: string;
  endTime?: string;
  isScheduled: boolean;
  User: {
    username: string;
  };
  details?: any;
}

interface MonitorLog {
  id: number;
  serverId: number;
  pingStatus: boolean;
  telnetStatus: boolean;
  responseTime: number;
  createdAt: string;
  Server: {
    name: string;
    hostname: string;
  };
}

const Logs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'restart' | 'monitor'>('restart');
  const [restartLogs, setRestartLogs] = useState<RestartLog[]>([]);
  const [monitorLogs, setMonitorLogs] = useState<MonitorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    restart: { page: 1, totalPages: 1 },
    monitor: { page: 1, totalPages: 1 }
  });

  useEffect(() => {
    loadLogs();
  }, [activeTab, pagination.restart.page, pagination.monitor.page]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'restart') {
        const data = await logsAPI.getRestartLogs(pagination.restart.page);
        setRestartLogs(data.logs);
        setPagination(prev => ({
          ...prev,
          restart: { page: data.currentPage, totalPages: data.pages }
        }));
      } else {
        const data = await logsAPI.getMonitorLogs(pagination.monitor.page);
        setMonitorLogs(data.logs);
        setPagination(prev => ({
          ...prev,
          monitor: { page: data.currentPage, totalPages: data.pages }
        }));
      }
    } catch (error) {
      toast.error('Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (tab: 'restart' | 'monitor', page: number) => {
    setPagination(prev => ({
      ...prev,
      [tab]: { ...prev[tab], page }
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'success':
        return 'text-green-500 bg-green-900/20';
      case 'failed':
      case 'error':
        return 'text-red-500 bg-red-900/20';
      case 'started':
      case 'pending':
        return 'text-yellow-500 bg-yellow-900/20';
      default:
        return 'text-gray-500 bg-gray-900/20';
    }
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    if (!endTime) return '-';
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diff = end.getTime() - start.getTime();
    return `${Math.round(diff / 1000)}s`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Logs & Audit</h1>
        <p className="text-gray-400">View restart and monitoring activity logs</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('restart')}
          className={`flex items-center px-4 py-2 rounded-md transition-colors ${
            activeTab === 'restart'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          <RotateCcw size={16} className="mr-2" />
          Restart Logs
        </button>
        <button
          onClick={() => setActiveTab('monitor')}
          className={`flex items-center px-4 py-2 rounded-md transition-colors ${
            activeTab === 'monitor'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          <Activity size={16} className="mr-2" />
          Monitor Logs
        </button>
      </div>

      {/* Content */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <FileText className="mr-2" size={20} />
            {activeTab === 'restart' ? 'Restart' : 'Monitor'} Logs
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : activeTab === 'restart' ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-6 text-gray-400 font-medium">ID</th>
                  <th className="text-left py-3 px-6 text-gray-400 font-medium">User</th>
                  <th className="text-left py-3 px-6 text-gray-400 font-medium">Servers</th>
                  <th className="text-left py-3 px-6 text-gray-400 font-medium">Status</th>
                  <th className="text-left py-3 px-6 text-gray-400 font-medium">Duration</th>
                  <th className="text-left py-3 px-6 text-gray-400 font-medium">Type</th>
                  <th className="text-left py-3 px-6 text-gray-400 font-medium">Started</th>
                </tr>
              </thead>
              <tbody>
                {restartLogs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-700 hover:bg-gray-750 transition-colors">
                    <td className="py-4 px-6 text-gray-300 font-mono">#{log.id}</td>
                    <td className="py-4 px-6 text-white font-medium">
                      {log.User?.username || 'System'}
                    </td>
                    <td className="py-4 px-6 text-gray-300">
                      {log.serverIds.length} server{log.serverIds.length !== 1 ? 's' : ''}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                        {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-300">
                      {formatDuration(log.startTime, log.endTime)}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        log.isScheduled ? 'bg-purple-900/20 text-purple-400' : 'bg-blue-900/20 text-blue-400'
                      }`}>
                        {log.isScheduled ? 'Scheduled' : 'Manual'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-400 text-sm">
                      {new Date(log.startTime).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {restartLogs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 px-6 text-center text-gray-400">
                      No restart logs available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-6 text-gray-400 font-medium">Server</th>
                  <th className="text-left py-3 px-6 text-gray-400 font-medium">Ping</th>
                  <th className="text-left py-3 px-6 text-gray-400 font-medium">Telnet</th>
                  <th className="text-left py-3 px-6 text-gray-400 font-medium">Response Time</th>
                  <th className="text-left py-3 px-6 text-gray-400 font-medium">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {monitorLogs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-700 hover:bg-gray-750 transition-colors">
                    <td className="py-4 px-6">
                      <div>
                        <div className="text-white font-medium">{log.Server?.name || 'Unknown'}</div>
                        <div className="text-gray-400 text-sm">{log.Server?.hostname || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        log.pingStatus ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'
                      }`}>
                        {log.pingStatus ? 'Success' : 'Failed'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        log.telnetStatus ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'
                      }`}>
                        {log.telnetStatus ? 'Success' : 'Failed'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-300">
                      {log.responseTime ? `${log.responseTime}ms` : '-'}
                    </td>
                    <td className="py-4 px-6 text-gray-400 text-sm">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {monitorLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 px-6 text-center text-gray-400">
                      No monitor logs available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-700 flex items-center justify-between">
          <div className="text-gray-400 text-sm">
            Page {pagination[activeTab].page} of {pagination[activeTab].totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(activeTab, pagination[activeTab].page - 1)}
              disabled={pagination[activeTab].page === 1}
              className="flex items-center px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <button
              onClick={() => handlePageChange(activeTab, pagination[activeTab].page + 1)}
              disabled={pagination[activeTab].page === pagination[activeTab].totalPages}
              className="flex items-center px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Logs;