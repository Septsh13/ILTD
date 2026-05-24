import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  CalendarDays,
  Home,
  LogOut,
  Settings,
  Trophy,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import growGloballyImage from '../assets/grow-globally.webp';

const menus = {
  ADMIN: [
    { name: 'Dashboard', path: '/admin/dashboard', icon: Home },
    { name: 'Global Leaderboard', path: '/admin/dashboard#leaderboard', icon: Trophy },
    { name: 'Chapter Leaderboard', path: '/admin/dashboard#chapter-leaderboard', icon: BarChart3 },
    { name: 'Total Members', path: '/admin/dashboard#members', icon: Users },
    { name: 'Meetings', path: '/admin/dashboard#meetings', icon: CalendarDays },
    { name: 'Settings', path: '/admin/dashboard#settings', icon: Settings },
  ],
  CHAPTER_PRESIDENT: [
    { name: 'Dashboard', path: '/president/dashboard', icon: Home },
    { name: 'My Chapter Members', path: '/president/dashboard#members', icon: Users },
    { name: 'Chapter Leaderboard', path: '/president/dashboard#leaderboard', icon: Trophy },
    { name: 'Meetings', path: '/president/dashboard#meetings', icon: CalendarDays },
    { name: 'Settings', path: '/president/dashboard#settings', icon: Settings },
  ],
  NORMAL_USER: [
    { name: 'Dashboard', path: '/user/dashboard', icon: Home },
    { name: 'My Chapter', path: '/user/dashboard#members', icon: Users },
    { name: 'Meetings', path: '/user/dashboard#meetings', icon: CalendarDays },
    { name: 'Leaderboard', path: '/user/dashboard#leaderboard', icon: Trophy },
    { name: 'Settings', path: '/user/dashboard#settings', icon: Settings },
  ],
};

export const Sidebar = ({ role, isOpen, isCollapsed, onClose }) => {
  const { logout } = useAuth();
  const items = menus[role] || [];

  return (
    <>
      <aside className={`sticky top-0 z-40 hidden h-screen flex-col bg-[#071b36] text-white shadow-2xl transition-all duration-300 lg:flex ${isCollapsed ? 'w-[88px]' : 'w-72'}`}>
        <div className={`flex items-start px-5 py-6 ${isCollapsed ? 'lg:justify-center' : 'justify-between'}`}>
          <div>
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/20 bg-white/10 text-lg font-black">
                GSN
              </div>
              <div className={isCollapsed ? 'lg:hidden' : ''}>
                <h1 className="text-2xl font-semibold leading-none">GSN</h1>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">
                  Global Success Network
                </p>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-2 px-4">
          {items.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={onClose}
              title={item.name}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${isCollapsed ? 'lg:justify-center lg:px-3' : ''} ${
                  isActive || window.location.hash === new URL(item.path, window.location.origin).hash
                    ? 'bg-[#5948f5] text-white shadow-[0_14px_30px_rgba(89,72,245,0.25)]'
                    : 'text-white/78 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <item.icon size={18} />
              <span className={isCollapsed ? 'lg:hidden' : ''}>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className={`m-4 rounded-2xl bg-[#2a277a] p-4 ${isCollapsed ? 'lg:hidden' : ''}`}>
          <p className="text-sm font-semibold">Grow Globally</p>
          <p className="mt-1 text-xs leading-5 text-white/70">Connect. Collaborate. Succeed.</p>
          <img
            src={growGloballyImage}
            alt=""
            className="mt-4 h-24 w-full rounded-xl object-cover object-center shadow-[0_12px_28px_rgba(0,0,0,0.22)]"
          />
        </div>

        <div className="border-t border-white/10 p-4">
          <button onClick={logout} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-red-200 hover:bg-red-500/10 ${isCollapsed ? 'lg:justify-center lg:px-3' : ''}`}>
            <LogOut size={16} />
            <span className={isCollapsed ? 'lg:hidden' : ''}>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};
