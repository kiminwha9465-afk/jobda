import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Briefcase, TrendingUp, Users, BarChart2, Calendar, Clock, ArrowRight } from 'lucide-react';
import { dashboardApi } from '../api';
import { Spinner, StatusBadge, SchedBadge } from '../components/ui';
import type { DashboardResponse, ApplicationStatus } from '../types';

function StatCard({ label, value, icon: Icon, cls, to }: {
  label: string; value: string | number;
  icon: React.FC<{ className?: string }>; cls: string; to: string;
}) {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate(to)}
      className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all text-left w-full">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cls}`}><Icon className="w-6 h-6" /></div>
      <div className="flex-1">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-gray-300" />
    </button>
  );
}

const fmt = (d: string) => new Date(d).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
const fmtDT = (d: string) => new Date(d).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const STATUS_TO_ROUTE: Partial<Record<ApplicationStatus, string>> = {
  INTERVIEW_1: '/job-postings',
  INTERVIEW_2: '/job-postings',
  DOCUMENT_PASS: '/job-postings',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery<DashboardResponse>({ queryKey: ['dashboard'], queryFn: dashboardApi.get, refetchInterval: 30000 });
  if (isLoading) return <Spinner />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>

      {/* Stat cards — each navigates to the relevant page */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="총 지원 수" value={data.totalPostings} icon={Briefcase} cls="bg-blue-50 text-blue-600" to="/job-postings" />
        <StatCard label="진행 중" value={data.activePostings} icon={TrendingUp} cls="bg-orange-50 text-orange-600" to="/job-postings" />
        <StatCard label="면접 수" value={data.interviewCount} icon={Users} cls="bg-violet-50 text-violet-600" to="/job-postings" />
        <StatCard label="서류 합격률" value={`${data.documentPassRate}%`} icon={BarChart2} cls="bg-emerald-50 text-emerald-600" to="/job-postings" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming schedules */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Calendar className="w-4 h-4 text-blue-500" />다가오는 일정</h2>
            <button onClick={() => navigate('/schedules')} className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-0.5">
              더보기<ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {data.upcomingSchedules.length === 0
            ? <p className="text-sm text-gray-400 py-6 text-center">예정된 일정이 없습니다</p>
            : <div className="space-y-3">
                {data.upcomingSchedules.map(s => (
                  <button key={s.id} onClick={() => navigate('/schedules')}
                    className="w-full flex items-start justify-between gap-3 hover:bg-gray-50 rounded-lg p-1.5 -mx-1.5 transition-colors text-left">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{s.title}</p>
                      {s.companyName && <p className="text-xs text-gray-400">{s.companyName}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <SchedBadge type={s.type} label={s.typeLabel} />
                      <p className="text-xs text-gray-400 mt-1">{fmtDT(s.scheduledAt)}</p>
                    </div>
                  </button>
                ))}
              </div>
          }
        </div>

        {/* Upcoming deadlines */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Clock className="w-4 h-4 text-red-500" />마감 임박 공고</h2>
            <button onClick={() => navigate('/job-postings')} className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-0.5">
              더보기<ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {data.upcomingDeadlines.length === 0
            ? <p className="text-sm text-gray-400 py-6 text-center">마감 임박 공고가 없습니다</p>
            : <div className="space-y-3">
                {data.upcomingDeadlines.map(jp => (
                  <button key={jp.id} onClick={() => navigate('/job-postings')}
                    className="w-full flex items-start justify-between gap-3 hover:bg-gray-50 rounded-lg p-1.5 -mx-1.5 transition-colors text-left">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{jp.title}</p>
                      {jp.companyName && <p className="text-xs text-gray-400">{jp.companyName}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <StatusBadge status={jp.status} />
                      {jp.deadline && <p className="text-xs text-gray-400 mt-1">{fmt(jp.deadline)}</p>}
                    </div>
                  </button>
                ))}
              </div>
          }
        </div>
      </div>

      {/* Status summary */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">지원 현황</h2>
          <button onClick={() => navigate('/job-postings')} className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-0.5">
            공고 목록<ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3">
          {Object.entries(data.statusSummary).map(([label, count]) => (
            <button key={label} onClick={() => navigate('/job-postings')}
              className="text-center p-2 rounded-lg bg-gray-50 hover:bg-blue-50 hover:shadow-sm transition-all">
              <p className="text-xl font-bold text-gray-900">{count}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
