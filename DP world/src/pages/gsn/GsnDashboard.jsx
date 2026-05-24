import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Download,
  IndianRupee,
  Languages,
  Lock,
  LogOut,
  Medal,
  MessageSquare,
  Plus,
  RefreshCcw,
  Save,
  Search,
  Settings,
  Shield,
  SlidersHorizontal,
  Trash2,
  Trophy,
  User,
  UserRoundCog,
  Users,
  X,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const number = new Intl.NumberFormat('en-IN');

const viewCopy = {
  admin: {
    title: 'Dashboard',
    leaderboard: 'Global Leaderboard',
    members: 'Total Members',
    chapter: 'All Chapters',
  },
  president: {
    title: 'Dashboard',
    leaderboard: "Candidate's Chapter Leaderboard",
    members: 'Users Under Me',
    chapter: "Candidate's Chapter",
  },
  user: {
    title: 'Dashboard',
    leaderboard: "Candidate's Chapter Leaderboard",
    members: 'My Chapter',
    chapter: "Candidate's Chapter",
  },
};

const accentClasses = {
  purple: 'bg-[#f1edff] text-[#5740d9]',
  green: 'bg-[#ebfbf2] text-[#1f9a63]',
  orange: 'bg-[#fff2e6] text-[#de7621]',
  blue: 'bg-[#edf6ff] text-[#3276d2]',
  pink: 'bg-[#fff0f8] text-[#ce4d91]',
};

const settingIcons = {
  profile: User,
  account: UserRoundCog,
  notifications: Bell,
  privacy: Lock,
  security: Shield,
  password: Lock,
  language: Languages,
  help: MessageSquare,
  about: Shield,
};

const emptyMeeting = {
  title: '',
  description: '',
  meeting_date: '',
  meeting_time: '',
  meeting_type: 'Online',
  location: '',
  meeting_link: '',
  chapter_id: '',
  status: 'UPCOMING',
};

const getInitials = (name = 'GSN') => name.split(' ').map((part) => part[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

const labelize = (text) => text.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());

const sectionFromHash = (hash) => {
  const value = hash.replace('#', '');
  if (['leaderboard', 'chapter-leaderboard', 'members', 'meetings', 'settings', 'chapters'].includes(value)) return value;
  return 'dashboard';
};

const routeForView = (view) => {
  if (view === 'admin') return '/admin/dashboard';
  if (view === 'president') return '/president/dashboard';
  return '/user/dashboard';
};

const roleCanManageMeetings = (view) => view === 'admin' || view === 'president';

const normalizeRows = (data, view, section) => {
  if (!data) return [];
  if (section === 'leaderboard') return data.leaderboards?.global || [];
  if (section === 'chapter-leaderboard') return data.leaderboards?.chapter || [];
  if (view === 'admin') return data.users?.filter((item) => item.role !== 'ADMIN') || [];
  if (view === 'president') return data.users?.filter((item) => item.id !== data.currentUser?.id) || [];
  return data.users || [];
};

const buildRegionBreakdown = (users = []) => {
  const map = new Map();
  users.forEach((user) => {
    const key = user.region || 'Unassigned';
    map.set(key, (map.get(key) || 0) + 1);
  });
  const colors = ['#5948f5', '#38b68b', '#f59f43', '#e05b81', '#8b7cf6', '#5e6475'];
  return Array.from(map.entries()).map(([label, value], index) => ({ label, value, color: colors[index % colors.length] }));
};

const buildCategoryRows = (users = []) => {
  const map = new Map();
  users.forEach((user) => {
    const key = user.member_category || 'Other';
    map.set(key, (map.get(key) || 0) + 1);
  });
  return Array.from(map.entries()).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
};

const buildMeetingTrend = (meetings = []) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const counts = months.map((label, index) => ({
    label,
    value: meetings.filter((meeting) => new Date(meeting.starts_at).getMonth() === index).length,
  }));
  const max = Math.max(1, ...counts.map((item) => item.value));
  return counts.map((item) => ({ ...item, y: 76 - (item.value / max) * 56 }));
};

const DashboardShell = ({ title, children, action }) => (
  <section className="rounded-[1.35rem] border border-black/5 bg-[#fffdf8] p-4 shadow-[0_16px_45px_rgba(62,52,38,0.06)] sm:p-5">
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-lg font-bold text-[#15130f]">{title}</h2>
      {action}
    </div>
    {children}
  </section>
);

const IconTile = ({ icon: Icon, tone = 'purple' }) => (
  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${accentClasses[tone]}`}>
    <Icon size={20} />
  </span>
);

const MetricCard = ({ icon, label, value, helper, tone, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="group min-h-[94px] rounded-[1.1rem] border border-black/5 bg-[#fffdf8] p-4 text-left shadow-[0_10px_28px_rgba(62,52,38,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(62,52,38,0.12)]"
  >
    <div className="flex items-start gap-3">
      <IconTile icon={icon} tone={tone} />
      <div className="min-w-0">
        <p className="text-xs font-semibold text-zinc-500">{label}</p>
        <p className="mt-1 text-2xl font-black leading-none text-[#171614]">{value}</p>
        <p className="mt-1 text-xs leading-5 text-zinc-500">{helper}</p>
      </div>
    </div>
  </button>
);

const UserAvatar = ({ name, src, size = 'md' }) => {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-11 w-11 text-sm',
    lg: 'h-16 w-16 text-lg',
  };
  return src ? (
    <img src={src} alt="" className={`${sizes[size]} rounded-full object-cover ring-2 ring-white`} />
  ) : (
    <div className={`${sizes[size]} grid shrink-0 place-items-center rounded-full bg-[#e9e3d6] font-bold text-[#171614] ring-2 ring-white`}>
      {getInitials(name)}
    </div>
  );
};

const MobileHeader = ({ data, title }) => (
  <div className="-mx-4 -mt-5 mb-4 rounded-b-[1.8rem] bg-[#071b36] px-4 pb-6 pt-5 text-white sm:hidden">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/20 bg-white/10 text-sm font-black">GSN</div>
        <div>
          <p className="text-xl font-bold leading-none">GSN</p>
          <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/55">Global Success Network</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <MessageSquare size={18} />
        <Bell size={18} />
      </div>
    </div>
    <h1 className="mt-6 text-xl font-bold">{title}</h1>
    {data?.currentUser && (
      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-[#fffdf8] p-3 text-[#171614]">
        <UserAvatar name={data.currentUser.full_name} size="lg" />
        <div>
          <p className="font-bold">Hello, {data.currentUser.full_name}</p>
          <p className="text-xs text-zinc-500">{data.currentUser.member_category || data.currentUser.roleLabel}</p>
          <span className="mt-2 inline-flex rounded-full bg-[#f1edff] px-3 py-1 text-xs font-bold text-[#5740d9]">
            {data.currentUser.chapter_name || 'GSN Member'}
          </span>
        </div>
      </div>
    )}
  </div>
);

const DataModal = ({ detail, onClose }) => {
  if (!detail) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/35 p-0 backdrop-blur-sm sm:place-items-center sm:p-5">
      <div className="max-h-[88vh] w-full overflow-hidden rounded-t-[1.6rem] border border-black/10 bg-[#fffdf8] shadow-[0_40px_120px_rgba(0,0,0,0.25)] sm:max-w-5xl sm:rounded-[1.6rem]">
        <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
          <div>
            <h3 className="text-xl font-bold">{detail.title}</h3>
            <p className="text-sm text-zinc-500">{detail.description}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl bg-[#f8f6f1] p-2">
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-auto p-5">
          {detail.type === 'chapters' && <ChapterTable chapters={detail.rows} />}
          {detail.type === 'meetings' && <MeetingsTable meetings={detail.rows} />}
          {detail.type === 'users' && <MembersTable rows={detail.rows} currentUserId={detail.currentUserId} />}
        </div>
      </div>
    </div>
  );
};

const MembersTable = ({ rows = [], currentUserId, compact = false }) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[720px] text-left text-sm">
      <thead>
        <tr className="bg-[#f1edff] text-xs font-bold text-[#39299c]">
          <th className="rounded-l-xl px-4 py-3">S.No.</th>
          <th className="px-4 py-3">Member Name</th>
          {!compact && <th className="px-4 py-3">Member Category</th>}
          {!compact && <th className="px-4 py-3">Chapter Name</th>}
          <th className="px-4 py-3">Total Referrals</th>
          <th className="rounded-r-xl px-4 py-3">Total Business Generated</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((member, index) => (
          <tr key={member.id} className={member.id === currentUserId ? 'bg-[#f6f3ff]' : 'border-b border-black/5'}>
            <td className="px-4 py-3 font-semibold">{index + 1}</td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-3">
                <UserAvatar name={member.full_name} src={member.profile_image_url} size="sm" />
                <div>
                  <p className="font-bold">{member.full_name}{member.id === currentUserId ? ' (You)' : ''}</p>
                  <p className="text-xs text-zinc-500">{member.email || member.employee_id}</p>
                </div>
              </div>
            </td>
            {!compact && <td className="px-4 py-3 text-zinc-600">{member.member_category || '-'}</td>}
            {!compact && <td className="px-4 py-3 text-zinc-600">{member.chapter_name || '-'}</td>}
            <td className="px-4 py-3 font-semibold">{number.format(member.total_referrals || 0)}</td>
            <td className="px-4 py-3 font-bold">{currency.format(member.business_generated_inr || 0)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ChapterTable = ({ chapters = [] }) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[680px] text-left text-sm">
      <thead>
        <tr className="bg-[#f1edff] text-xs font-bold text-[#39299c]">
          <th className="rounded-l-xl px-4 py-3">Chapter</th>
          <th className="px-4 py-3">President</th>
          <th className="px-4 py-3">Members</th>
          <th className="px-4 py-3">Region</th>
          <th className="px-4 py-3">Referrals</th>
          <th className="rounded-r-xl px-4 py-3">Meetings</th>
        </tr>
      </thead>
      <tbody>
        {chapters.map((chapter) => (
          <tr key={chapter.id} className="border-b border-black/5">
            <td className="px-4 py-3 font-bold">{chapter.name}</td>
            <td className="px-4 py-3">{chapter.president_name || 'Unassigned'}</td>
            <td className="px-4 py-3">{number.format(chapter.reported_member_count || chapter.member_count || 0)}</td>
            <td className="px-4 py-3">{[chapter.city, chapter.region].filter(Boolean).join(', ') || '-'}</td>
            <td className="px-4 py-3">{number.format(chapter.total_referrals_generated || 0)}</td>
            <td className="px-4 py-3">{number.format(chapter.total_meetings_conducted || 0)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const MeetingsTable = ({ meetings = [], onEdit, onDelete, canManage = false }) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[720px] text-left text-sm">
      <thead>
        <tr className="bg-[#f1edff] text-xs font-bold text-[#39299c]">
          <th className="rounded-l-xl px-4 py-3">Date</th>
          <th className="px-4 py-3">Meeting Title</th>
          <th className="px-4 py-3">Chapter</th>
          <th className="px-4 py-3">Type</th>
          <th className="px-4 py-3">Status</th>
          {canManage && <th className="rounded-r-xl px-4 py-3">Actions</th>}
        </tr>
      </thead>
      <tbody>
        {meetings.map((meeting) => (
          <tr key={meeting.id} className="border-b border-black/5">
            <td className="px-4 py-3 text-zinc-600">{new Date(meeting.starts_at).toLocaleDateString('en-IN')}</td>
            <td className="px-4 py-3">
              <p className="font-bold">{meeting.title}</p>
              <p className="text-xs text-zinc-500">{meeting.location || meeting.meeting_link || 'Location pending'}</p>
            </td>
            <td className="px-4 py-3">{meeting.chapter_name || 'GSN'}</td>
            <td className="px-4 py-3">{meeting.meeting_type}</td>
            <td className="px-4 py-3"><StatusBadge status={meeting.status} /></td>
            {canManage && (
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => onEdit(meeting)} className="rounded-lg bg-[#f8f6f1] px-3 py-2 text-xs font-bold">Edit</button>
                  <button type="button" onClick={() => onDelete(meeting.id)} className="rounded-lg bg-red-50 p-2 text-red-600"><Trash2 size={15} /></button>
                </div>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const StatusBadge = ({ status }) => {
  const done = status === 'COMPLETED';
  const cancelled = status === 'CANCELLED';
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${done ? 'bg-[#ebfbf2] text-[#209960]' : cancelled ? 'bg-red-50 text-red-600' : 'bg-[#f1edff] text-[#5740d9]'}`}>
      {status}
    </span>
  );
};

const EventCard = ({ meeting }) => {
  const date = new Date(meeting.starts_at);
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-black/5 bg-[#fffdf8] p-3">
      <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[#f1edff] text-center">
        <span className="text-xs font-black uppercase text-[#5740d9]">{date.toLocaleString('en-IN', { month: 'short' })}</span>
        <span className="text-2xl font-black leading-none">{date.getDate()}</span>
      </div>
      <div className="min-w-0">
        <p className="truncate font-bold">{meeting.title}</p>
        <p className="text-xs text-zinc-500">{meeting.chapter_name || 'GSN Chapter'}</p>
        <p className="text-xs text-zinc-500">{date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} - {meeting.meeting_type}</p>
      </div>
    </div>
  );
};

const MatchmakingCard = ({ data }) => {
  const current = data.currentUser;
  const candidates = (data.leaderboards?.chapter || data.leaderboards?.global || []).filter((member) => member.id !== current.id);
  const matched = candidates[0] || data.users?.find((member) => member.id !== current.id);
  if (!matched) return null;

  return (
    <DashboardShell
      title="AI Matchmaking (This Week)"
      action={<a href="#members" className="text-xs font-bold text-[#5740d9]">View All Matches</a>}
    >
      <div className="rounded-2xl bg-[#f8f6f1] p-5">
        <div className="flex items-center justify-center gap-6 text-center">
          <div>
            <UserAvatar name={current.full_name} src={current.profile_image_url} size="lg" />
            <p className="mt-2 text-xs font-bold text-[#5740d9]">You</p>
            <p className="text-sm font-black">{current.full_name}</p>
            <p className="text-xs text-zinc-500">{current.member_category || current.roleLabel}</p>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-full bg-[#fffdf8] text-[#5740d9] shadow-sm">
            <RefreshCcw size={18} />
          </div>
          <div>
            <UserAvatar name={matched.full_name} src={matched.profile_image_url} size="lg" />
            <p className="mt-2 text-xs font-bold text-[#5740d9]">Matched With</p>
            <p className="text-sm font-black">{matched.full_name}</p>
            <p className="text-xs text-zinc-500">{matched.member_category || matched.roleLabel}</p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#f1edff] px-4 py-2 text-xs font-semibold text-[#5740d9]">
          <span>This match is active for 7 days</span>
          <span>{new Date().toLocaleDateString('en-IN')} - {new Date(Date.now() + 7 * 86400000).toLocaleDateString('en-IN')}</span>
        </div>
      </div>
    </DashboardShell>
  );
};

const DonutChart = ({ rows }) => {
  const total = rows.reduce((sum, row) => sum + row.value, 0) || 1;
  let offset = 25;
  return (
    <div className="grid gap-6 md:grid-cols-[260px_1fr] md:items-center">
      <div className="relative mx-auto h-56 w-56">
        <svg viewBox="0 0 42 42" className="h-full w-full -rotate-90">
          <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#efe8da" strokeWidth="7" />
          {rows.map((row) => {
            const length = (row.value / total) * 100;
            const segment = (
              <circle
                key={row.label}
                cx="21"
                cy="21"
                r="15.915"
                fill="transparent"
                stroke={row.color}
                strokeWidth="7"
                strokeDasharray={`${length} ${100 - length}`}
                strokeDashoffset={offset}
              />
            );
            offset -= length;
            return segment;
          })}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-2xl font-black">{number.format(total)}</p>
            <p className="text-xs text-zinc-500">Total</p>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="inline-flex items-center gap-2 text-zinc-600"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: row.color }} />{row.label}</span>
            <span className="font-bold">{number.format(row.value)} ({Math.round((row.value / total) * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const LineChart = ({ points }) => {
  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${16 + index * 46} ${point.y}`).join(' ');
  const area = `${path} L ${16 + (points.length - 1) * 46} 88 L 16 88 Z`;
  return (
    <div className="rounded-2xl bg-[#fffdf8] p-4">
      <svg viewBox="0 0 270 104" className="h-56 w-full">
        {[20, 40, 60, 80].map((y) => <line key={y} x1="14" x2="256" y1={y} y2={y} stroke="#eee8dc" strokeWidth="1" />)}
        <path d={area} fill="url(#trendGradient)" />
        <path d={path} fill="none" stroke="#7562f2" strokeWidth="2.5" />
        {points.map((point, index) => (
          <g key={point.label}>
            <circle cx={16 + index * 46} cy={point.y} r="3.5" fill="#7562f2" />
            <text x={16 + index * 46} y="101" textAnchor="middle" className="fill-zinc-500 text-[8px]">{point.label}</text>
          </g>
        ))}
        <defs>
          <linearGradient id="trendGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#7562f2" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#7562f2" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

const MiniInput = ({ label, value, onChange, type = 'text', disabled = false, required = true }) => (
  <label className="block">
    <span className="text-xs font-bold text-zinc-500">{label}</span>
    <input
      disabled={disabled}
      required={required && !disabled}
      type={type}
      className="mt-1 h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-[#5740d9] disabled:bg-zinc-100"
      value={value || ''}
      onChange={(event) => onChange(event.target.value)}
    />
  </label>
);

const MiniSelect = ({ label, value, onChange, children, disabled = false }) => (
  <label className="block">
    <span className="text-xs font-bold text-zinc-500">{label}</span>
    <select
      disabled={disabled}
      required={!disabled}
      className="mt-1 h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-[#5740d9] disabled:bg-zinc-100"
      value={value || ''}
      onChange={(event) => onChange(event.target.value)}
    >
      {children}
    </select>
  </label>
);

const MiniTextarea = ({ label, value, onChange, required = false }) => (
  <label className="block">
    <span className="text-xs font-bold text-zinc-500">{label}</span>
    <textarea
      required={required}
      className="mt-1 min-h-20 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#5740d9]"
      value={value || ''}
      onChange={(event) => onChange(event.target.value)}
    />
  </label>
);

const PrimaryButton = ({ children, type = 'button', onClick, disabled = false }) => (
  <button
    type={type}
    disabled={disabled}
    onClick={onClick}
    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#5740d9] px-4 text-sm font-black text-white shadow-[0_14px_30px_rgba(87,64,217,0.2)] transition hover:bg-[#4732bd] disabled:cursor-not-allowed disabled:opacity-60"
  >
    {children}
  </button>
);

const Overview = ({ data, view, setDetail, navigate }) => {
  const current = data.currentUser;
  const upcoming = data.meetings.filter((meeting) => meeting.status === 'UPCOMING').slice(0, 3);
  const metrics = [
    { icon: Users, label: view === 'admin' ? 'Total GSN Members' : 'Total Chapter Members', value: number.format(data.metrics.totalGsnMembers), helper: view === 'admin' ? 'All Chapters' : 'View Chapter', tone: 'purple', type: 'users', rows: data.users },
    { icon: Users, label: view === 'admin' ? 'Total Chapter Members' : 'Members in Your Chapter', value: number.format(data.metrics.chapterMembers), helper: current.chapter_name || 'Chapter scope', tone: 'green', type: 'users', rows: normalizeRows(data, view, 'members') },
    { icon: CalendarDays, label: view === 'admin' ? 'Total Chapters' : 'Total Meetings', value: number.format(view === 'admin' ? data.metrics.totalChapters : data.metrics.totalMeetings), helper: view === 'admin' ? 'Across GSN' : 'All time', tone: 'orange', type: view === 'admin' ? 'chapters' : 'meetings', rows: view === 'admin' ? data.chapters : data.meetings },
    { icon: Trophy, label: view === 'admin' ? 'Candidate Chapter' : 'Referrals Given by You', value: view === 'admin' ? (current.chapter_name || 'Unassigned') : number.format(data.metrics.referralsGiven), helper: view === 'admin' ? 'Joined chapter' : 'Till date', tone: 'blue', type: 'users', rows: normalizeRows(data, view, 'chapter-leaderboard') },
    { icon: Users, label: 'Referrals Received by You', value: number.format(data.metrics.referralsReceived), helper: 'Based on chapter activity', tone: 'green', type: 'users', rows: normalizeRows(data, view, 'chapter-leaderboard') },
    { icon: Medal, label: 'Total Referrals in Your Chapter', value: number.format(data.metrics.totalReferrals), helper: 'This month', tone: 'purple', type: 'users', rows: normalizeRows(data, view, 'chapter-leaderboard') },
    { icon: IndianRupee, label: 'Business Generated', value: currency.format(data.metrics.businessGeneratedInr), helper: 'Till date', tone: 'green', type: 'users', rows: normalizeRows(data, view, 'leaderboard') },
  ];

  return (
    <div className="space-y-5">
      <div className="hidden items-center justify-between sm:flex">
        <div>
          <h1 className="text-3xl font-black text-[#15130f]">{viewCopy[view].title}</h1>
          <p className="mt-1 text-sm text-zinc-500">Welcome back, {current.full_name}. Your GSN network is ready.</p>
        </div>
        <button type="button" onClick={() => navigate(`${routeForView(view)}#settings`)} className="rounded-xl border border-black/10 bg-[#fffdf8] px-4 py-2 text-sm font-bold">
          View Profile
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.label}
            {...metric}
            onClick={() => setDetail({
              type: metric.type,
              title: metric.label,
              description: 'Live data from PostgreSQL for this dashboard metric.',
              rows: metric.rows,
              currentUserId: current.id,
            })}
          />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <DashboardShell title="Upcoming Events" action={<button type="button" onClick={() => navigate(`${routeForView(view)}#meetings`)} className="text-xs font-bold text-[#5740d9]">View All</button>}>
          <div className="space-y-3">
            {upcoming.length ? upcoming.map((meeting) => <EventCard key={meeting.id} meeting={meeting} />) : <p className="rounded-2xl bg-[#f8f6f1] p-4 text-sm text-zinc-500">No upcoming meetings.</p>}
          </div>
        </DashboardShell>
        <MatchmakingCard data={data} />
      </div>
    </div>
  );
};

const LeaderboardScreen = ({ data, view, section }) => {
  const global = section === 'leaderboard';
  const rows = normalizeRows(data, view, section);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#5740d9] text-sm font-black text-white">{global ? '2' : '3'}</p>
          <h1 className="mt-3 text-2xl font-black">{global ? 'Global Leaderboard' : "Candidate's Chapter Leaderboard"}</h1>
          <p className="mt-1 text-sm text-zinc-500">{global ? 'Ranked by performance across referrals and business generated.' : data.currentUser.chapter_name || 'Chapter ranking'}</p>
        </div>
        <button type="button" className="hidden items-center gap-2 rounded-xl border border-black/10 bg-[#fffdf8] px-4 py-2 text-sm font-bold sm:inline-flex">
          <Download size={16} /> Export
        </button>
      </div>
      <DashboardShell title={global ? 'Global Leaderboard' : data.currentUser.chapter_name || 'Chapter Leaderboard'}>
        <MembersTable rows={rows} currentUserId={data.currentUser.id} compact={!global} />
      </DashboardShell>
    </div>
  );
};

const MembersScreen = ({ data, view, setDetail }) => {
  const [query, setQuery] = useState('');
  const rows = normalizeRows(data, view, 'members').filter((member) => {
    const haystack = `${member.full_name} ${member.employee_id} ${member.member_category} ${member.chapter_name} ${member.region}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });
  const regionRows = buildRegionBreakdown(data.users);
  const categoryRows = buildCategoryRows(rows);

  return (
    <div className="space-y-5">
      <div>
        <p className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#5740d9] text-sm font-black text-white">4</p>
        <h1 className="mt-3 text-2xl font-black">{view === 'admin' ? 'Total Members' : 'Users Under Me'}</h1>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Users} label="Total GSN Members" value={number.format(data.metrics.totalGsnMembers)} helper={`Across ${data.chapters.length} chapters`} tone="purple" onClick={() => setDetail({ type: 'users', title: 'All Members', description: 'Members in current scope.', rows: data.users, currentUserId: data.currentUser.id })} />
        <MetricCard icon={Users} label="Members in Your Chapter" value={number.format(data.metrics.chapterMembers)} helper={data.currentUser.chapter_name || 'Chapter'} tone="green" onClick={() => setDetail({ type: 'users', title: 'Chapter Members', description: 'Members assigned to your chapter.', rows, currentUserId: data.currentUser.id })} />
        <MetricCard icon={Plus} label="New Members This Month" value={number.format(rows.filter((member) => new Date(member.created_at).getMonth() === new Date().getMonth()).length)} helper="Current month" tone="orange" onClick={() => setDetail({ type: 'users', title: 'New Members', description: 'Members created this month.', rows: rows.filter((member) => new Date(member.created_at).getMonth() === new Date().getMonth()), currentUserId: data.currentUser.id })} />
        <MetricCard icon={Medal} label="Chapter Presidents" value={number.format(data.metrics.chapterPresidents)} helper="Leadership users" tone="blue" onClick={() => setDetail({ type: 'users', title: 'Chapter Presidents', description: 'President accounts in scope.', rows: data.users.filter((member) => member.role === 'CHAPTER_PRESIDENT'), currentUserId: data.currentUser.id })} />
      </div>
      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <DashboardShell title="Members by Region">
          <DonutChart rows={regionRows} />
        </DashboardShell>
        <DashboardShell title={`Members in Your Chapter (${data.currentUser.chapter_name || 'GSN'})`}>
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3">
            <Search size={16} className="text-zinc-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="h-11 flex-1 bg-transparent text-sm outline-none" placeholder="Search members..." />
            <SlidersHorizontal size={16} className="text-zinc-400" />
          </div>
          <div className="overflow-hidden rounded-2xl border border-black/5">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f8f6f1] text-xs text-zinc-500">
                <tr><th className="px-4 py-3">Member Category</th><th className="px-4 py-3 text-right">Total Members</th></tr>
              </thead>
              <tbody>
                {categoryRows.map((row) => <tr key={row.label} className="border-t border-black/5"><td className="px-4 py-3">{row.label}</td><td className="px-4 py-3 text-right font-bold">{row.value}</td></tr>)}
                <tr className="bg-[#f1edff] font-black"><td className="px-4 py-3">Total</td><td className="px-4 py-3 text-right">{rows.length}</td></tr>
              </tbody>
            </table>
          </div>
        </DashboardShell>
      </div>
      <DashboardShell title={view === 'president' ? 'Users Under Me' : 'Member Directory'}>
        <MembersTable rows={rows} currentUserId={data.currentUser.id} />
      </DashboardShell>
    </div>
  );
};

const ChaptersScreen = ({ data }) => (
  <div className="space-y-5">
    <div>
      <h1 className="text-2xl font-black">Chapters</h1>
      <p className="mt-1 text-sm text-zinc-500">Chapter mapping, presidents, and member counts.</p>
    </div>
    <DashboardShell title="All Chapters">
      <ChapterTable chapters={data.chapters} />
    </DashboardShell>
  </div>
);

const MeetingsScreen = ({ data, view, onChanged }) => {
  const canManage = roleCanManageMeetings(view);
  const [form, setForm] = useState({ ...emptyMeeting, chapter_id: data.currentUser.chapter_id || '' });
  const [editingId, setEditingId] = useState('');
  const [message, setMessage] = useState('');
  const trend = buildMeetingTrend(data.meetings);

  const updateForm = (field) => (value) => setForm((current) => ({ ...current, [field]: value }));

  const startEdit = (meeting) => {
    const date = new Date(meeting.starts_at);
    setEditingId(meeting.id);
    setForm({
      title: meeting.title || '',
      description: meeting.description || '',
      meeting_date: date.toISOString().slice(0, 10),
      meeting_time: date.toTimeString().slice(0, 5),
      meeting_type: meeting.meeting_type || 'Online',
      location: meeting.location || '',
      meeting_link: meeting.meeting_link || '',
      chapter_id: meeting.chapter_id || data.currentUser.chapter_id || '',
      status: meeting.status || 'UPCOMING',
    });
  };

  const resetForm = () => {
    setEditingId('');
    setForm({ ...emptyMeeting, chapter_id: data.currentUser.chapter_id || '' });
  };

  const submit = async (event) => {
    event.preventDefault();
    if (editingId) {
      await api.put(`/network/meetings/${editingId}`, form);
      setMessage('Meeting updated.');
    } else {
      await api.post('/network/meetings', form);
      setMessage('Meeting created.');
    }
    resetForm();
    onChanged();
  };

  const remove = async (id) => {
    await api.delete(`/network/meetings/${id}`);
    setMessage('Meeting deleted.');
    onChanged();
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#5740d9] text-sm font-black text-white">5</p>
        <h1 className="mt-3 text-2xl font-black">Total Meetings</h1>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={CalendarDays} label="Total Meetings" value={number.format(data.metrics.totalMeetings)} helper="All time" tone="purple" />
        <MetricCard icon={CalendarDays} label="Meetings This Month" value={number.format(data.meetings.filter((m) => new Date(m.starts_at).getMonth() === new Date().getMonth()).length)} helper="Current month" tone="blue" />
        <MetricCard icon={CalendarDays} label="Upcoming Meetings" value={number.format(data.metrics.upcomingMeetings)} helper="Scheduled" tone="pink" />
        <MetricCard icon={CheckCircle2} label="Completed This Month" value={number.format(data.metrics.completedMeetings)} helper="Completed" tone="green" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <DashboardShell title="Meetings Trend"><LineChart points={trend} /></DashboardShell>
        <DashboardShell title="Recent Meetings">
          <MeetingsTable meetings={data.meetings.slice(0, 6)} canManage={canManage} onEdit={startEdit} onDelete={remove} />
        </DashboardShell>
      </div>
      {canManage && (
        <DashboardShell title={editingId ? 'Edit Meeting' : view === 'admin' ? 'Create Global Meeting' : 'Create Chapter Meeting'}>
          <form onSubmit={submit} className="grid gap-4 lg:grid-cols-2">
            <MiniInput label="Meeting Title" value={form.title} onChange={updateForm('title')} />
            <MiniSelect label="Meeting Type" value={form.meeting_type} onChange={updateForm('meeting_type')}><option>Online</option><option>Offline</option></MiniSelect>
            <MiniInput label="Date" type="date" value={form.meeting_date} onChange={updateForm('meeting_date')} />
            <MiniInput label="Time" type="time" value={form.meeting_time} onChange={updateForm('meeting_time')} required={false} />
            <MiniSelect label="Status" value={form.status} onChange={updateForm('status')}><option>UPCOMING</option><option>COMPLETED</option><option>CANCELLED</option></MiniSelect>
            <MiniSelect label="Assigned Chapter" value={form.chapter_id} onChange={updateForm('chapter_id')} disabled={view !== 'admin'}>
              <option value="">Select chapter</option>
              {data.chapters.map((chapter) => <option key={chapter.id} value={chapter.id}>{chapter.name}</option>)}
            </MiniSelect>
            <MiniInput label="Location" value={form.location} onChange={updateForm('location')} required={false} />
            <MiniInput label="Meeting Link" value={form.meeting_link} onChange={updateForm('meeting_link')} required={false} />
            <div className="lg:col-span-2"><MiniTextarea label="Description" value={form.description} onChange={updateForm('description')} /></div>
            <div className="flex flex-wrap gap-3 lg:col-span-2">
              <PrimaryButton type="submit"><Save size={16} />{editingId ? 'Save Changes' : 'Create Meeting'}</PrimaryButton>
              {editingId && <button type="button" onClick={resetForm} className="h-11 rounded-xl border border-black/10 px-4 text-sm font-bold">Cancel</button>}
            </div>
          </form>
          {message && <p className="mt-4 rounded-xl bg-[#ebfbf2] px-4 py-3 text-sm font-bold text-[#209960]">{message}</p>}
        </DashboardShell>
      )}
      <DashboardShell title="All Meetings">
        <MeetingsTable meetings={data.meetings} canManage={canManage} onEdit={startEdit} onDelete={remove} />
      </DashboardShell>
    </div>
  );
};

const SettingsScreen = ({ data, onChanged }) => {
  const { logout } = useAuth();
  const [active, setActive] = useState('profile');
  const [settingsData, setSettingsData] = useState(null);
  const [profile, setProfile] = useState({});
  const [password, setPassword] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    api.get('/network/settings').then(({ data: response }) => {
      if (!mounted) return;
      setSettingsData(response.settings);
      setProfile(response.profile);
    });
    return () => { mounted = false; };
  }, []);

  const saveProfile = async () => {
    await api.put('/network/settings/profile', profile);
    setMessage('Profile saved.');
    onChanged();
  };

  const savePreferences = async (patch) => {
    const next = { ...settingsData, ...patch };
    setSettingsData(next);
    await api.put('/network/settings/preferences', next);
    setMessage('Settings saved.');
  };

  const changePassword = async () => {
    await api.post('/network/settings/change-password', password);
    setPassword({ current_password: '', new_password: '', confirm_password: '' });
    setMessage('Password changed.');
  };

  const items = [
    ['profile', 'Profile Settings'],
    ['account', 'Account Settings'],
    ['notifications', 'Notification Settings'],
    ['privacy', 'Privacy Settings'],
    ['security', 'Security Settings'],
    ['password', 'Change Password'],
    ['language', 'Language'],
    ['help', 'Help & Support'],
    ['about', 'About GSN'],
  ];

  if (!settingsData) return <div className="rounded-2xl bg-[#fffdf8] p-8 text-center font-bold">Loading settings...</div>;

  return (
    <div className="space-y-5">
      <div>
        <p className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#5740d9] text-sm font-black text-white">6</p>
        <h1 className="mt-3 text-2xl font-black">Application Settings</h1>
      </div>
      <div className="grid gap-5 xl:grid-cols-[300px_1fr]">
        <DashboardShell title="Profile">
          <div className="flex items-center gap-4 xl:block xl:text-center">
            <UserAvatar name={data.currentUser.full_name} src={data.currentUser.profile_image_url} size="lg" />
            <div className="xl:mt-3">
              <p className="font-black">{data.currentUser.full_name}</p>
              <p className="text-sm text-zinc-500">{data.currentUser.member_category || data.currentUser.roleLabel}</p>
              <span className="mt-2 inline-flex rounded-full bg-[#f1edff] px-3 py-1 text-xs font-bold text-[#5740d9]">Premium Member</span>
            </div>
          </div>
          <div className="mt-5 divide-y divide-black/5 rounded-2xl border border-black/5">
            {items.map(([key, label]) => {
              const Icon = settingIcons[key];
              return (
                <button key={key} type="button" onClick={() => setActive(key)} className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold ${active === key ? 'bg-[#f1edff] text-[#5740d9]' : 'hover:bg-[#f8f6f1]'}`}>
                  <Icon size={16} />
                  <span className="flex-1">{label}</span>
                  <ChevronRight size={16} />
                </button>
              );
            })}
          </div>
          <button type="button" onClick={logout} className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-left text-sm font-bold text-red-600">
            <LogOut size={16} /> Logout
          </button>
        </DashboardShell>

        <DashboardShell title={items.find(([key]) => key === active)?.[1] || 'Settings'}>
          {active === 'profile' && (
            <div className="grid gap-4 lg:grid-cols-2">
              <MiniInput label="Full Name" value={profile.full_name} onChange={(value) => setProfile((p) => ({ ...p, full_name: value }))} />
              <MiniInput label="Member Category" value={profile.member_category} onChange={(value) => setProfile((p) => ({ ...p, member_category: value }))} />
              <MiniInput label="Email Address" value={profile.email} onChange={(value) => setProfile((p) => ({ ...p, email: value }))} />
              <MiniInput label="Chapter" value={profile.chapter_name} onChange={() => {}} disabled />
              <MiniInput label="Phone Number" value={profile.phone} onChange={(value) => setProfile((p) => ({ ...p, phone: value }))} required={false} />
              <MiniInput label="Region" value={profile.region} onChange={(value) => setProfile((p) => ({ ...p, region: value }))} required={false} />
              <div className="lg:col-span-2"><MiniTextarea label="Bio/About" value={profile.bio} onChange={(value) => setProfile((p) => ({ ...p, bio: value }))} /></div>
              <div className="lg:col-span-2"><PrimaryButton onClick={saveProfile}><Save size={16} />Save Changes</PrimaryButton></div>
            </div>
          )}
          {active === 'account' && (
            <div className="grid gap-4 lg:grid-cols-2">
              <MiniInput label="Username" value={profile.employee_id} onChange={() => {}} disabled />
              <MiniInput label="Role" value={profile.roleLabel || profile.role} onChange={() => {}} disabled />
              <MiniInput label="Profile Picture URL" value={profile.profile_image_url} onChange={(value) => setProfile((p) => ({ ...p, profile_image_url: value }))} required={false} />
              <MiniInput label="Gender" value={profile.gender} onChange={(value) => setProfile((p) => ({ ...p, gender: value }))} required={false} />
              <PrimaryButton onClick={saveProfile}><Save size={16} />Save Account</PrimaryButton>
            </div>
          )}
          {active === 'notifications' && <SettingsToggles data={settingsData.notifications} onChange={(next) => savePreferences({ notifications: next })} />}
          {active === 'privacy' && <SettingsToggles data={settingsData.privacy} onChange={(next) => savePreferences({ privacy: next })} />}
          {active === 'security' && <SettingsToggles data={settingsData.security} onChange={(next) => savePreferences({ security: next })} />}
          {active === 'password' && (
            <div className="grid max-w-xl gap-4">
              <MiniInput label="Current Password" type="password" value={password.current_password} onChange={(value) => setPassword((p) => ({ ...p, current_password: value }))} />
              <MiniInput label="New Password" type="password" value={password.new_password} onChange={(value) => setPassword((p) => ({ ...p, new_password: value }))} />
              <MiniInput label="Confirm Password" type="password" value={password.confirm_password} onChange={(value) => setPassword((p) => ({ ...p, confirm_password: value }))} />
              <PrimaryButton onClick={changePassword}><Lock size={16} />Change Password</PrimaryButton>
            </div>
          )}
          {active === 'language' && (
            <div className="max-w-sm">
              <MiniSelect label="Application Language" value={settingsData.language} onChange={(language) => savePreferences({ language })}>
                {['English', 'Hindi', 'Tamil', 'Malayalam'].map((language) => <option key={language}>{language}</option>)}
              </MiniSelect>
            </div>
          )}
          {active === 'help' && (
            <div className="space-y-4">
              <p className="text-sm text-zinc-600">Support tickets and FAQ workflows are ready for the next integration layer.</p>
              <MiniTextarea label="Report an issue" value="" onChange={() => {}} />
              <p className="font-bold">support@gsn.network</p>
            </div>
          )}
          {active === 'about' && (
            <div className="space-y-3 text-sm leading-6 text-zinc-600">
              <p>GSN is a premium business networking platform for chapters, referrals, meetings, and member growth.</p>
              <p className="font-bold text-[#171614]">Version 1.0.0 - Global Success Network</p>
            </div>
          )}
          {message && <p className="mt-4 rounded-xl bg-[#ebfbf2] px-4 py-3 text-sm font-bold text-[#209960]">{message}</p>}
        </DashboardShell>
      </div>
    </div>
  );
};

const SettingsToggles = ({ data, onChange }) => (
  <div className="grid gap-3">
    {Object.entries(data).map(([key, value]) => (
      <label key={key} className="flex items-center justify-between rounded-2xl border border-black/5 bg-[#f8f6f1] px-4 py-3 text-sm font-bold">
        <span>{labelize(key)}</span>
        {typeof value === 'boolean' ? (
          <input type="checkbox" checked={value} onChange={(event) => onChange({ ...data, [key]: event.target.checked })} className="h-5 w-5 accent-[#5740d9]" />
        ) : (
          <input value={value || ''} onChange={(event) => onChange({ ...data, [key]: event.target.value })} className="h-10 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none" />
        )}
      </label>
    ))}
  </div>
);

export const GsnDashboard = ({ view }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null);
  const section = sectionFromHash(location.hash);

  const load = async () => {
    try {
      setLoading(true);
      const response = await api.get('/network/dashboard');
      setData(response.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to load dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="rounded-2xl bg-[#fffdf8] p-8 text-center font-bold">Loading GSN dashboard...</div>;
  if (error) return <div className="rounded-2xl bg-red-50 p-8 text-red-700">{error}</div>;

  const title = section === 'dashboard'
    ? viewCopy[view].title
    : section === 'leaderboard'
      ? 'Global Leaderboard'
      : section === 'chapter-leaderboard'
        ? "Candidate's Chapter Leaderboard"
        : section === 'members'
          ? viewCopy[view].members
          : section === 'meetings'
            ? 'Total Meetings'
            : section === 'settings'
              ? 'Application Settings'
              : 'Chapters';

  return (
    <div className="pb-20 sm:pb-0">
      <MobileHeader data={data} title={title} />
      <DataModal detail={detail} onClose={() => setDetail(null)} />
      {section === 'dashboard' && <Overview data={data} view={view} setDetail={setDetail} navigate={navigate} />}
      {section === 'leaderboard' && <LeaderboardScreen data={data} view={view} section="leaderboard" />}
      {section === 'chapter-leaderboard' && <LeaderboardScreen data={data} view={view} section="chapter-leaderboard" />}
      {section === 'members' && <MembersScreen data={data} view={view} setDetail={setDetail} />}
      {section === 'chapters' && <ChaptersScreen data={data} />}
      {section === 'meetings' && <MeetingsScreen data={data} view={view} onChanged={load} />}
      {section === 'settings' && <SettingsScreen data={data} onChanged={load} />}
    </div>
  );
};
