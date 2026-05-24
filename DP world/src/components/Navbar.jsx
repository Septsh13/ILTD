import React from 'react';
import { Bell, Menu, MessageSquare, Search, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const roleLabel = {
  ADMIN: 'Global Admin',
  CHAPTER_PRESIDENT: 'Chapter President',
  NORMAL_USER: 'Member',
};

export const Navbar = ({ onMenu, onCollapse }) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-20 hidden border-b border-black/5 bg-[#fffdf8]/85 px-4 py-3 backdrop-blur sm:block sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center gap-4">
        <button className="rounded-xl border border-black/10 bg-white p-2 lg:hidden" onClick={onMenu} aria-label="Toggle sidebar">
          <Menu size={20} />
        </button>
        <button className="hidden rounded-xl border border-black/10 bg-white p-2 lg:block" onClick={onCollapse} aria-label="Collapse sidebar">
          <Menu size={20} />
        </button>

        <div className="relative hidden min-w-0 flex-1 sm:block">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            className="h-11 w-full max-w-2xl rounded-xl border border-black/10 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-black/40"
            placeholder="Search members, chapters, referrals..."
          />
        </div>

        <div className="ml-auto flex items-center gap-3">
          <button className="rounded-xl border border-black/10 bg-white p-2 text-zinc-600 hover:text-black">
            <MessageSquare size={18} />
          </button>
          <button className="relative rounded-xl border border-black/10 bg-white p-2 text-zinc-600 hover:text-black">
            <Bell size={18} />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
          </button>
          <div className="hidden items-center gap-3 rounded-xl border border-black/10 bg-white px-3 py-2 sm:flex">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-[#f3efff] text-[#4f35b8]">
              <User size={18} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user?.name || user?.employeeId || 'GSN User'}</p>
              <p className="text-xs text-zinc-500">{roleLabel[user?.role] || 'User'}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
