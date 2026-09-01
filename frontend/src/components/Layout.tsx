import { NavLink, Outlet, Link } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Building2, FileText, ClipboardList, Calendar, Tag, Search } from 'lucide-react';

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
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside className="w-56 bg-slate-900 flex flex-col shrink-0">
        <Link to="/" className="block px-5 py-5 border-b border-slate-700 hover:bg-slate-800 transition-colors">
          <p className="text-lg font-bold text-white tracking-tight">Jobda</p>
          <p className="text-xs text-slate-400 mt-0.5">취업 관리 시스템</p>
        </Link>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-slate-700">
          <p className="text-xs text-slate-500">Spring Boot + React</p>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
