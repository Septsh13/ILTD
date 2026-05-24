import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  UploadCloud, 
  History, 
  FileCheck, 
  BarChart3, 
  AlertCircle, 
  Settings,
  Users,
  MessageCircle,
  MessageSquare,
  LogOut,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const roleMenus = {
  CHA_AGENT: [
    { name: 'Dashboard', path: '/cha/dashboard', icon: LayoutDashboard },
    { name: 'Shipments', path: '/cha/shipments', icon: Package },
    { name: 'File Complaint', path: '/complaint', icon: AlertCircle },
  ],
  GOVT_OFFICIAL: [
    { name: 'Review Panel', path: '/govt/dashboard', icon: LayoutDashboard },
  ],
  CBI: [
    { name: 'Investigation Dashboard', path: '/cbi', icon: LayoutDashboard },
    { name: 'Active Cases', path: '/cbi', icon: AlertCircle },
  ],
  ADMIN: [
    { name: 'Analytics', path: '/admin/dashboard', icon: BarChart3 },
    { name: 'Shipment Reviews', path: '/admin/reviews', icon: MessageSquare },
    { name: 'Complaints Management', path: '/admin/complaints', icon: AlertCircle },
    { name: 'Audit Logs', path: '/admin/logs', icon: History },
    { name: 'User Management', path: '/admin/users', icon: Users },
  ],
  COMPLAINANT: [
    { name: 'My Complaints', path: '/complaint/status', icon: LayoutDashboard },
    { name: 'File Complaint', path: '/complaint/new', icon: AlertCircle },
  ],
};

export const Sidebar = ({ role }) => {
  const { logout } = useAuth();
  const menuItems = roleMenus[role] || [];

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-blue-200 flex flex-col shadow-sm">
      <div className="p-6 border-b border-blue-200">
        <h1 className="text-2xl font-bold text-blue-600 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg border-2 border-blue-500 flex items-center justify-center text-blue-500 font-extrabold text-sm">
            CP
          </div>
          ClearPath
        </h1>
        <p className="text-xs text-blue-800 font-medium uppercase tracking-wider mt-2 opacity-70">
          Logistics Transparency
        </p>
      </div>

      <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                isActive
                  ? 'bg-blue-50 text-blue-600 shadow-sm border border-blue-100'
                  : 'text-blue-800 hover:bg-slate-100 hover:text-blue-600'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 border-t border-blue-200 bg-slate-50 mt-auto">
        <div className="flex flex-col gap-1">
          <button 
            onClick={() => alert('Password change UI to be implemented by administrator.')} 
            className="flex items-center gap-3 px-4 py-2 text-sm text-blue-700 hover:bg-slate-200 rounded-lg transition text-left"
          >
            <Lock className="w-4 h-4 opacity-70" />
            Change Password
          </button>
          <button 
            onClick={logout} 
            className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition text-left"
          >
            <LogOut className="w-4 h-4 opacity-70" />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
};
