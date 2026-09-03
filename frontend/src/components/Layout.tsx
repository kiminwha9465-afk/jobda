import { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Briefcase, Building2, FileText, ClipboardList,
  Calendar, Tag, Search, LogOut, User, Menu, X, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const nav = [
  { to: '/', label: '대시보드', icon: LayoutDashboard, end: true },
  { to: '/job-postings', label: '채용공고', icon: Briefcase },
  { to: '/companies', label: '기업', icon: Building2 },
  { to: '/cover-letters', label: '자소서', icon: FileText },
  { to: '/resumes', label: '이력서', icon: ClipboardList },
  { to: '/schedules', label: '일정', icon: Calendar },
  { to: '/tags', label: '태그', icon: Tag },
  { to: '/search', label: '검색', icon: Search },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);   // desktop collapse
  const [mobileOpen, setMobileOpen] = useState(false); // mobile overlay

  const handleLogout = () => { logout(); navigate('/login'); };
  const closeMobile = () => setMobileOpen(false);

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {/* Logo */}
      <div className={`flex items-center border-b border-slate-700 ${collapsed && !mobile ? 'justify-center px-2 py-4' : 'px-5 py-5'}`}>
        {collapsed && !mobile ? (
          <Link to="/" onClick={closeMobile}>
            <span className="text-lg font-bold text-white">J</span>
          </Link>
        ) : (
          <Link to="/" className="flex-1 hover:opacity-80 transition-opacity" onClick={closeMobile}>
            <p className="text-lg font-bold text-white tracking-tight">Jobda</p>
            <p className="text-xs text-slate-400 mt-0.5">취업 관리 시스템</p>
          </Link>
        )}
        {/* Desktop collapse toggle */}
        {!mobile && (
          <button
            onClick={() => setCollapsed(v => !v)}
            className="ml-2 p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors shrink-0"
            title={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
        {/* Mobile close button */}
        {mobile && (
          <button onClick={closeMobile} className="ml-auto p-1 rounded text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}
            onClick={mobile ? closeMobile : undefined}
            title={collapsed && !mobile ? label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg text-sm font-medium transition-colors
              ${collapsed && !mobile ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'}
              ${isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {(!collapsed || mobile) && label}
          </NavLink>
        ))}
      </nav>

      {/* User / logout */}
      <div className="px-2 py-3 border-t border-slate-700">
        {(!collapsed || mobile) && (
          <div className="flex items-center gap-2 px-2 py-2 mb-1">
            <User className="w-4 h-4 text-slate-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          title={collapsed && !mobile ? '로그아웃' : undefined}
          className={`flex items-center gap-2 w-full rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors
            ${collapsed && !mobile ? 'justify-center px-2 py-2.5' : 'px-3 py-2'}`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {(!collapsed || mobile) && '로그아웃'}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* ── Mobile overlay backdrop ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={closeMobile}
        />
      )}

      {/* ── Mobile sidebar (overlay) ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-56 bg-slate-900 flex flex-col
        transform transition-transform duration-200
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        md:hidden
      `}>
        <SidebarContent mobile />
      </aside>

      {/* ── Desktop sidebar (inline collapsible) ── */}
      <aside className={`
        hidden md:flex flex-col bg-slate-900 shrink-0
        transition-all duration-200
        ${collapsed ? 'w-14' : 'w-56'}
      `}>
        <SidebarContent />
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-base font-bold text-gray-900">Jobda</span>
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
