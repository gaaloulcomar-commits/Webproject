import React, { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { serversAPI, monitoringAPI } from '../services/api';
import { 
  Server, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ServerStatus {
  id: number;
  name: string;
  hostname: string;
  ipAddress: string;
  port: number;
  status: 'online' | 'offline' | 'unknown';
  lastPing?: string;
  lastTelnet?: string;
  responseTime?: number;
}

const Dashboard: React.FC = () => {
  const [servers, setServers] = useState<ServerStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    online: 0,
    offline: 0,
    unknown: 0
  });
  const { socket } = useSocket();

  useEffect(() => {
    loadServerStatus();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('server-status', (data) => {
        setServers(prev => prev.map(server => 
          server.id === data.serverId 
            ? { ...server, status: data.status, responseTime: data.responseTime }
            : server
        ));
      });

      return () => {
        socket.off('server-status');
      };
    }
  }, [socket]);

  useEffect(() => {
    const newStats = {
      total: servers.length,
      online: servers.filter(s => s.status === 'online').length,
      offline: servers.filter(s => s.status === 'offline').length,
      unknown: servers.filter(s => s.status === 'unknown').length
    };
    setStats(newStats);
  }, [servers]);

  const loadServerStatus = async () => {
    try {
      const data = await monitoringAPI.getStatus();
      setServers(data);
    } catch (error) {
      toast.error('Failed to load server status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'offline': return 'text-red-500';
      default: return 'text-yellow-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return CheckCircle;
      case 'offline': return AlertTriangle;
      default: return Clock;
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
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400">Real-time server monitoring overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Servers</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <Server className="text-blue-500" size={32} />
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Online</p>
              <p className="text-2xl font-bold text-green-500">{stats.online}</p>
            </div>
            <CheckCircle className="text-green-500" size={32} />
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Offline</p>
              <p className="text-2xl font-bold text-red-500">{stats.offline}</p>
            </div>
            <AlertTriangle className="text-red-500" size={32} />
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Unknown</p>
              <p className="text-2xl font-bold text-yellow-500">{stats.unknown}</p>
            </div>
            <Clock className="text-yellow-500" size={32} />
          </div>
        </div>
      </div>

      {/* Server Status Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <Activity className="mr-2" size={20} />
            Server Status
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-6 text-gray-400 font-medium">Server</th>
                <th className="text-left py-3 px-6 text-gray-400 font-medium">Status</th>
                <th className="text-left py-3 px-6 text-gray-400 font-medium">IP Address</th>
                <th className="text-left py-3 px-6 text-gray-400 font-medium">Port</th>
                <th className="text-left py-3 px-6 text-gray-400 font-medium">Response Time</th>
                <th className="text-left py-3 px-6 text-gray-400 font-medium">Last Check</th>
              </tr>
            </thead>
            <tbody>
              {servers.map((server) => {
                const StatusIcon = getStatusIcon(server.status);
                return (
                  <tr key={server.id} className="border-b border-gray-700 hover:bg-gray-750 transition-colors">
                    <td className="py-4 px-6">
                      <div>
                        <div className="text-white font-medium">{server.name}</div>
                        <div className="text-gray-400 text-sm">{server.hostname}</div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <StatusIcon size={16} className={getStatusColor(server.status)} />
                        <span className={`capitalize font-medium ${getStatusColor(server.status)}`}>
                          {server.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-300">{server.ipAddress}</td>
                    <td className="py-4 px-6 text-gray-300">{server.port}</td>
                    <td className="py-4 px-6 text-gray-300">
                      {server.responseTime ? `${server.responseTime}ms` : '-'}
                    </td>
                    <td className="py-4 px-6 text-gray-400 text-sm">
                      {server.lastPing ? new Date(server.lastPing).toLocaleString() : 'Never'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;