import { X } from 'lucide-react';
import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ApplicationStatus, ScheduleType } from '../types';

export function Modal({ isOpen, onClose, title, children, size = 'md' }: {
  isOpen: boolean; onClose: () => void; title: string; children: ReactNode; size?: 'md' | 'xl';
}) {
  if (!isOpen) return null;
  const maxW = size === 'xl' ? 'max-w-4xl' : 'max-w-2xl';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative bg-white rounded-xl shadow-2xl w-full ${maxW} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className ?? ''}`} />;
}
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} rows={props.rows ?? 3} className={`${inputCls} resize-none ${props.className ?? ''}`} />;
}
export function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return <select {...props} className={`${inputCls} bg-white ${props.className ?? ''}`}>{children}</select>;
}

export function Btn({ variant = 'primary', className = '', children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }) {
  const s = { primary: 'bg-blue-600 text-white hover:bg-blue-700', secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200', danger: 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200', ghost: 'text-gray-600 hover:bg-gray-100' }[variant];
  return <button {...props} className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${s} ${className}`}>{children}</button>;
}

export function Spinner() {
  return <div className="flex items-center justify-center h-32"><div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
}
export function Empty({ message }: { message: string }) {
  return <div className="flex items-center justify-center py-16 text-sm text-gray-400">{message}</div>;
}

export function PageHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-6 min-h-[40px]">
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      <div>{action}</div>
    </div>
  );
}

const STATUS_MAP: Record<ApplicationStatus, string> = {
  INTERESTED: 'bg-slate-100 text-slate-600',
  PLAN_TO_APPLY: 'bg-sky-100 text-sky-700',
  APPLIED: 'bg-blue-100 text-blue-700',
  DOCUMENT_PASS: 'bg-violet-100 text-violet-700',
  INTERVIEW_1: 'bg-orange-100 text-orange-700',
  INTERVIEW_2: 'bg-amber-100 text-amber-700',
  FINAL_PASS: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  WITHDRAWN: 'bg-gray-200 text-gray-500',
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_MAP[status] ?? 'bg-gray-100 text-gray-600'}`}>{status}</span>;
}

export function TagBadge({ name, color, onRemove }: { name: string; color?: string | null; onRemove?: () => void }) {
  const navigate = useNavigate();
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-opacity ${!onRemove ? 'cursor-pointer hover:opacity-70' : ''}`}
      style={{ backgroundColor: color ? `${color}22` : '#f1f5f9', color: color ?? '#475569' }}
      onClick={!onRemove ? () => navigate(`/search?q=${encodeURIComponent(name)}`) : undefined}
    >
      #{name}
      {onRemove && <button onClick={e => { e.stopPropagation(); onRemove(); }} className="ml-0.5 hover:opacity-70"><X className="w-3 h-3" /></button>}
    </span>
  );
}

const SCHED_CLS: Record<ScheduleType, string> = {
  DEADLINE: 'bg-red-100 text-red-700',
  TEST: 'bg-orange-100 text-orange-700',
  INTERVIEW_1: 'bg-violet-100 text-violet-700',
  INTERVIEW_2: 'bg-purple-100 text-purple-700',
  INTERVIEW_FINAL: 'bg-indigo-100 text-indigo-700',
  CODING_TEST: 'bg-yellow-100 text-yellow-700',
  PERSONAL: 'bg-teal-100 text-teal-700',
  ETC: 'bg-gray-100 text-gray-600',
};

export function SchedBadge({ type, label }: { type: ScheduleType; label: string }) {
  return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${SCHED_CLS[type] ?? 'bg-gray-100'}`}>{label}</span>;
}
