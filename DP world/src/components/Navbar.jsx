import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, User, LogOut, Search } from 'lucide-react';
import { ProfileModal } from './ProfileModal';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  
  const roleDisplay = user?.role?.replace('_', ' ') || 'USER';

  return (
    <header className="h-20 bg-white border-b border-blue-200 shadow-sm px-8 flex items-center justify-between sticky top-0 z-10">
      
      <div className="flex items-center max-w-md w-full">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
          <input 
            type="text" 
            placeholder="Search documents, shipments, IDs..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-blue-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all text-blue-800 placeholder:text-blue-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button className="relative p-2 text-blue-600 hover:bg-slate-100 rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        
        <div className="w-px h-8 bg-blue-200"></div>

        <div className="flex items-center gap-4 group">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-blue-800">Govt ID: 192837</p>
            <p className="text-xs text-blue-500 uppercase tracking-wide">{roleDisplay}</p>
          </div>
          
          <button 
            onClick={() => setIsProfileOpen(true)}
            className="w-10 h-10 rounded-full bg-blue-100 hover:bg-blue-200 border-2 border-blue-200 hover:border-blue-300 flex items-center justify-center text-blue-600 overflow-hidden transition"
            title="Edit Profile"
          >
            <User className="w-5 h-5" />
          </button>

          <button 
            onClick={logout}
            className="p-2 text-blue-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors hidden sm:block"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {isProfileOpen && (
        <ProfileModal 
          userRole={user?.role} 
          onClose={() => setIsProfileOpen(false)} 
        />
      )}
    </header>
  );
};
