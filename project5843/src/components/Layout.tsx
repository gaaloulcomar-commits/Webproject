import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import {
  LayoutDashboard,
  Server,
  Activity,
  RotateCcw,
  FileText,
  Calendar,
  Users,
  LogOut,
  Menu,
  X,
  Wifi,
  WifiOff
} from 'lucide-react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { 
      icon: LayoutDashboard, 
      label: 'Dashboard', 
      path: '/dashboard',
      permission: 'canMonitor'
    },
    { 
      icon: Server, 
      label: 'Servers', 
      path: '/servers',
      permission: 'canManageServers'
    },
    { 
      icon: Activity, 
      label: 'Monitoring', 
      path: '/monitoring',
      permission: 'canMonitor'
    },
    { 
      icon: RotateCcw, 
      label: 'Restart', 
      path: '/restart',
      permission: 'canRestart'
    },
    { 
      icon: FileText, 
      label: 'Logs', 
      path: '/logs',
      permission: 'canViewLogs'
    },
    { 
      icon: Calendar, 
      label: 'Scheduler', 
      path: '/scheduler',
      permission: 'canScheduleTasks'
    },
    { 
      icon: Users, 
      label: 'Users', 
      path: '/users',
      permission: 'canManageUsers'
    }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    user?.role === 'admin' || user?.permissions[item.permission as keyof typeof user.permissions]
  );

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-6 bg-gray-900">
          <h1 className="text-xl font-bold text-white">Server Monitor</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>
        
        <nav className="mt-8">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-6 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200 ${
                  isActive ? 'bg-gray-700 text-white border-r-2 border-blue-500' : ''
                }`}
              >
                <Icon size={20} className="mr-3" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-gray-800 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <Menu size={24} />
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {connected ? (
                  <Wifi size={20} className="text-green-500" />
                ) : (
                  <WifiOff size={20} className="text-red-500" />
                )}
                <span className="text-sm text-gray-300">
                  {connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-gray-300">
                  Welcome, <span className="font-medium text-white">{user?.username}</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors duration-200"
                >
                  <LogOut size={16} className="mr-2" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-auto bg-gray-900 p-6">
          {children}
        </main>
      </div>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;