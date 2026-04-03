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
  MessageCircle
} from 'lucide-react';

const roleMenus = {
  CHA_AGENT: [
    { name: 'Dashboard', path: '/cha/dashboard', icon: LayoutDashboard },
    { name: 'Shipments', path: '/cha/shipments', icon: Package },
    { name: 'Upload Document', path: '/cha/upload', icon: UploadCloud },
    { name: 'Interaction Log', path: '/cha/log', icon: History },
    { name: 'File Complaint', path: '/complaint', icon: AlertCircle },
    { name: 'Track Complaint', path: '/complaint/status', icon: MessageCircle },
  ],
  GOVT_OFFICIAL: [
    { name: 'Review Panel', path: '/govt/dashboard', icon: LayoutDashboard },
    { name: 'Assigned Documents', path: '/govt/documents', icon: FileCheck },
    { name: 'Performance', path: '/govt/performance', icon: BarChart3 },
  ],
  CBI: [
    { name: 'Investigation Dashboard', path: '/cbi', icon: LayoutDashboard },
    { name: 'Active Cases', path: '/cbi', icon: AlertCircle },
  ],
  ADMIN: [
    { name: 'Analytics', path: '/admin/dashboard', icon: BarChart3 },
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
  const menuItems = roleMenus[role] || [];

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-brown-200 flex flex-col shadow-sm">
      <div className="p-6 border-b border-brown-200">
        <h1 className="text-2xl font-bold text-brown-600 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg border-2 border-brown-500 flex items-center justify-center text-brown-500 font-extrabold text-sm">
            CP
          </div>
          ClearPath
        </h1>
        <p className="text-xs text-brown-800 font-medium uppercase tracking-wider mt-2 opacity-70">
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
                  ? 'bg-brown-50 text-brown-600 shadow-sm border border-brown-100'
                  : 'text-brown-800 hover:bg-beige-100 hover:text-brown-600'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 border-t border-brown-200 bg-beige-50 mt-auto">
        <div className="flex items-center gap-3 px-4 py-3 text-sm text-brown-700">
          <Settings className="w-5 h-5 opacity-70" />
          Settings
        </div>
      </div>
    </aside>
  );
};
