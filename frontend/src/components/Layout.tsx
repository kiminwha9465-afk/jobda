import { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Briefcase, Building2, FileText, ClipboardList,
  Calendar, Tag, Search, LogOut, User, Menu, X, ChevronLeft, ChevronRight, GripVertical,
} from 'lucide-react';
import {
  DndContext, PointerSensor, useSensor, useSensors, closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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

const NAV_ORDER_KEY = 'jobda_nav_order';

function loadNavOrder(): string[] {
  try {
    const saved = localStorage.getItem(NAV_ORDER_KEY);
    if (saved) {
      const parsed: string[] = JSON.parse(saved);
      const allIds = nav.map(n => n.to);
      const valid = parsed.filter(id => allIds.includes(id));
      const missing = allIds.filter(id => !valid.includes(id));
      return [...valid, ...missing];
    }
  } catch {}
  return nav.map(n => n.to);
}

type NavItem = typeof nav[number];

function SortableNavItem({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.to });
  const Icon = item.icon;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center group ${isDragging ? 'opacity-50' : ''}`}
    >
      {!collapsed && (
        <span
          {...attributes}
          {...listeners}
          className="flex-none w-5 flex items-center justify-center self-stretch opacity-0 group-hover:opacity-50 cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="w-3.5 h-3.5 text-slate-400" />
        </span>
      )}
      <NavLink
        to={item.to}
        end={item.end}
        title={collapsed ? item.label : undefined}
        className={({ isActive }) =>
          `flex items-center gap-3 rounded-lg text-sm font-medium transition-colors
          ${collapsed ? 'w-full justify-center px-2 py-2.5' : 'flex-1 px-3 py-2.5'}
          ${isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`
        }
      >
        <Icon className="w-4 h-4 shrink-0" />
        {!collapsed && item.label}
      </NavLink>
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navOrder, setNavOrder] = useState<string[]>(loadNavOrder);

  const sortedNav = navOrder
    .map(id => nav.find(n => n.to === id))
    .filter((n): n is NavItem => !!n);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    setNavOrder(prev => {
      const next = arrayMove(prev, prev.indexOf(active.id as string), prev.indexOf(over.id as string));
      localStorage.setItem(NAV_ORDER_KEY, JSON.stringify(next));
      return next;
    });
  }

  const closeMobile = () => setMobileOpen(false);
  const handleLogout = () => { logout(); navigate('/login'); };

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
        {!mobile && (
          <button
            onClick={() => setCollapsed(v => !v)}
            className="ml-2 p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors shrink-0"
            title={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
        {mobile && (
          <button onClick={closeMobile} className="ml-auto p-1 rounded text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav — mobile: 드래그 없음, desktop: 드래그 정렬 */}
      {mobile ? (
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {sortedNav.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={closeMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg text-sm font-medium transition-colors px-3 py-2.5
                ${isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={navOrder} strategy={verticalListSortingStrategy}>
            <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
              {sortedNav.map(item => (
                <SortableNavItem key={item.to} item={item} collapsed={collapsed} />
              ))}
            </nav>
          </SortableContext>
        </DndContext>
      )}

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
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={closeMobile} />
      )}

      {/* Mobile sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-56 bg-slate-900 flex flex-col
        transform transition-transform duration-200
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        md:hidden
      `}>
        <SidebarContent mobile />
      </aside>

      {/* Desktop sidebar */}
      <aside className={`
        hidden md:flex flex-col bg-slate-900 shrink-0
        transition-all duration-200
        ${collapsed ? 'w-14' : 'w-56'}
      `}>
        <SidebarContent />
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-slate-900 shrink-0">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300">
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-base font-bold text-white tracking-tight">Jobda</span>
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 pt-6 pb-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
