import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, User, LogOut, Search } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  
  const roleDisplay = user?.role?.replace('_', ' ') || 'USER';

  return (
    <header className="h-20 bg-white border-b border-brown-200 shadow-sm px-8 flex items-center justify-between sticky top-0 z-10">
      
      <div className="flex items-center max-w-md w-full">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brown-400" />
          <input 
            type="text" 
            placeholder="Search documents, shipments, IDs..." 
            className="w-full pl-10 pr-4 py-2 bg-beige-50 border border-brown-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-brown-400 transition-all text-brown-800 placeholder:text-brown-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button className="relative p-2 text-brown-600 hover:bg-beige-100 rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        
        <div className="w-px h-8 bg-brown-200"></div>

        <div className="flex items-center gap-4 group">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-brown-800">Govt ID: 192837</p>
            <p className="text-xs text-brown-500 uppercase tracking-wide">{roleDisplay}</p>
          </div>
          
          <div className="w-10 h-10 rounded-full bg-brown-100 border-2 border-brown-200 flex items-center justify-center text-brown-600 overflow-hidden">
            <User className="w-5 h-5" />
          </div>

          <button 
            onClick={logout}
            className="p-2 text-brown-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors hidden sm:block"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
