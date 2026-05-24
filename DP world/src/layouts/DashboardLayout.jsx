import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';
import { BarChart3, CalendarDays, Home, Settings, Users } from 'lucide-react';

const basePath = {
  ADMIN: '/admin/dashboard',
  CHAPTER_PRESIDENT: '/president/dashboard',
  NORMAL_USER: '/user/dashboard',
};

const mobileItems = [
  { name: 'Dashboard', hash: '', icon: Home },
  { name: 'Leaderboard', hash: '#leaderboard', icon: BarChart3 },
  { name: 'Members', hash: '#members', icon: Users },
  { name: 'Meetings', hash: '#meetings', icon: CalendarDays },
  { name: 'Settings', hash: '#settings', icon: Settings },
];

export const DashboardLayout = ({ role }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const rootPath = basePath[role] || '/user/dashboard';

  return (
    <div className="min-h-screen bg-[#f7f4ec] text-[#15130f]">
      <div className="flex min-h-screen">
        <Sidebar
          role={role}
          isOpen={isSidebarOpen}
          isCollapsed={isCollapsed}
          onClose={() => setIsSidebarOpen(false)}
        />
        <div className="flex min-w-0 flex-1 flex-col transition-all duration-300">
          <Navbar
            onMenu={() => setIsSidebarOpen((current) => !current)}
            onCollapse={() => setIsCollapsed((current) => !current)}
          />
          <main className="flex-1 overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-7xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-[#fffdf8]/95 px-2 py-2 shadow-[0_-18px_45px_rgba(62,52,38,0.1)] backdrop-blur sm:hidden">
        <div className="grid grid-cols-5">
          {mobileItems.map((item) => (
            <NavLink
              key={item.name}
              to={`${rootPath}${item.hash}`}
              className={() => {
                const active = window.location.hash === item.hash || (!item.hash && !window.location.hash);
                return `flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-bold transition ${active ? 'text-[#5740d9]' : 'text-zinc-500'}`;
              }}
            >
              <item.icon size={18} />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};
