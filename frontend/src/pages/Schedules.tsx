import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, CheckCircle2, Circle, ChevronLeft, ChevronRight, List, CalendarDays } from 'lucide-react';
import { schedulesApi, jobPostingsApi } from '../api';
import type { ScheduleResponse, ScheduleRequest, ScheduleType } from '../types';
import { Modal, Field, Input, Textarea, Select, Btn, Spinner, Empty, SchedBadge, PageHeader } from '../components/ui';

const TYPES: { value: ScheduleType; label: string }[] = [
  { value: 'DEADLINE', label: '마감일' }, { value: 'TEST', label: '필기시험' },
  { value: 'CODING_TEST', label: '코딩테스트' }, { value: 'INTERVIEW_1', label: '1차면접' },
  { value: 'INTERVIEW_2', label: '2차면접' }, { value: 'INTERVIEW_FINAL', label: '최종면접' },
  { value: 'PERSONAL', label: '개인일정' }, { value: 'ETC', label: '기타' },
];

const TYPE_DOT: Record<ScheduleType, string> = {
  DEADLINE: 'bg-red-400', TEST: 'bg-purple-400', CODING_TEST: 'bg-violet-400',
  INTERVIEW_1: 'bg-blue-400', INTERVIEW_2: 'bg-indigo-400', INTERVIEW_FINAL: 'bg-indigo-500',
  PERSONAL: 'bg-slate-400', ETC: 'bg-gray-300',
};

const now = () => { const d = new Date(); d.setMinutes(0, 0, 0); return d.toISOString().slice(0, 16); };
const DEF: ScheduleRequest = { title: '', type: 'DEADLINE', scheduledAt: now(), location: '', memo: '', jobPostingId: null };
const fmtDT = (d: string) => new Date(d).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
const fmtTime = (d: string) => new Date(d).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
const WEEK = ['일', '월', '화', '수', '목', '금', '토'];

// ─── Calendar helpers ────────────────────────────────────────────────
function calendarDays(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days: (Date | null)[] = [];
  for (let i = 0; i < first.getDay(); i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function schedulesForDay(list: ScheduleResponse[], day: Date) {
  return list.filter(s => isSameDay(new Date(s.scheduledAt), day))
             .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
}

// ─── Calendar View ───────────────────────────────────────────────────
function CalendarView({
  list, onAdd, onEdit, onDelete, onToggle,
}: {
  list: ScheduleResponse[];
  onAdd: (date?: Date) => void;
  onEdit: (s: ScheduleResponse) => void;
  onDelete: (s: ScheduleResponse) => void;
  onToggle: (id: number) => void;
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<Date | null>(null);

  const days = calendarDays(year, month);
  const selectedSchedules = selected ? schedulesForDay(list, selected) : [];

  function prevMonth() { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); }
  function nextMonth() { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); }
  function goToday() { setYear(today.getFullYear()); setMonth(today.getMonth()); setSelected(today); }

  function selectDay(day: Date) {
    if (selected && isSameDay(selected, day)) setSelected(null);
    else setSelected(day);
  }

  return (
    <div>
      {/* Month nav */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><ChevronLeft className="w-4 h-4" /></button>
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-gray-900">{year}년 {month + 1}월</h2>
            <button onClick={goToday} className="text-xs px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 font-medium">오늘</button>
          </div>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><ChevronRight className="w-4 h-4" /></button>
        </div>

        {/* Week header */}
        <div className="grid grid-cols-7 border-b">
          {WEEK.map((w, i) => (
            <div key={w} className={`py-2 text-center text-xs font-semibold ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'}`}>{w}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} className="min-h-[80px] border-r border-b border-gray-100 bg-gray-50/50" />;
            const dayScheds = schedulesForDay(list, day);
            const isToday = isSameDay(day, today);
            const isSel = selected ? isSameDay(selected, day) : false;
            const isSun = day.getDay() === 0;
            const isSat = day.getDay() === 6;
            return (
              <div
                key={day.toISOString()}
                onClick={() => selectDay(day)}
                className={`min-h-[80px] border-r border-b border-gray-100 p-1.5 cursor-pointer transition-colors
                  ${isSel ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full
                    ${isToday ? 'bg-blue-600 text-white' : isSun ? 'text-red-400' : isSat ? 'text-blue-400' : 'text-gray-700'}`}>
                    {day.getDate()}
                  </span>
                  {dayScheds.length > 0 && (
                    <button
                      onClick={e => { e.stopPropagation(); onAdd(day); }}
                      className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-blue-500 hidden"
                    />
                  )}
                </div>
                <div className="space-y-0.5">
                  {dayScheds.slice(0, 3).map(s => (
                    <div key={s.id} className={`flex items-center gap-1 rounded px-1 py-0.5 ${s.completed ? 'opacity-40' : ''}`}>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${TYPE_DOT[s.type]}`} />
                      <span className="text-xs text-gray-700 truncate leading-tight">{s.title}</span>
                    </div>
                  ))}
                  {dayScheds.length > 3 && (
                    <p className="text-xs text-gray-400 pl-1">+{dayScheds.length - 3}개</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected day detail panel */}
      {selected && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">
              {selected.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
            </h3>
            <button onClick={() => onAdd(selected)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
              <Plus className="w-3.5 h-3.5" />일정 추가
            </button>
          </div>
          {selectedSchedules.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">이 날의 일정이 없습니다</p>
          ) : (
            <div className="space-y-2">
              {selectedSchedules.map(s => (
                <ScheduleRow key={s.id} s={s} onEdit={onEdit} onDelete={onDelete} onToggle={onToggle} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Shared row component ────────────────────────────────────────────
function ScheduleRow({ s, onEdit, onDelete, onToggle }: {
  s: ScheduleResponse;
  onEdit: (s: ScheduleResponse) => void;
  onDelete: (s: ScheduleResponse) => void;
  onToggle: (id: number) => void;
}) {
  const today = new Date();
  const isDue = new Date(s.scheduledAt) <= today;
  return (
    <div className={`flex items-center gap-4 px-4 py-3 rounded-xl border border-gray-100 transition-opacity ${s.completed ? 'opacity-50' : ''}`}>
      <button onClick={() => onToggle(s.id)} className="shrink-0 text-gray-300 hover:text-emerald-500 transition-colors">
        {s.completed ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <SchedBadge type={s.type} label={s.typeLabel} />
          <p className={`text-sm font-medium ${s.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>{s.title}</p>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
          <span className={isDue && !s.completed ? 'text-red-500 font-medium' : ''}>{fmtTime(s.scheduledAt)}</span>
          {s.companyName && <span>{s.companyName}</span>}
          {s.jobPostingTitle && <span className="truncate">{s.jobPostingTitle}</span>}
          {s.location && <span>{s.location}</span>}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={() => onEdit(s)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
        <button onClick={() => onDelete(s)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────
export default function Schedules() {
  const qc = useQueryClient();
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [filter, setFilter] = useState<ScheduleType | 'ALL' | 'UPCOMING'>('UPCOMING');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ScheduleResponse | null>(null);
  const [form, setForm] = useState<ScheduleRequest>(DEF);

  const { data: listFiltered = [], isLoading: listLoading } = useQuery({
    queryKey: ['schedules', filter],
    queryFn: () => filter === 'UPCOMING' ? schedulesApi.upcoming() : schedulesApi.list(filter !== 'ALL' ? { type: filter as ScheduleType } : undefined),
    enabled: viewMode === 'list',
  });

  const { data: allSchedules = [], isLoading: calLoading } = useQuery({
    queryKey: ['schedules', 'all'],
    queryFn: () => schedulesApi.list(),
    enabled: viewMode === 'calendar',
  });

  const { data: postings = [] } = useQuery({ queryKey: ['job-postings'], queryFn: () => jobPostingsApi.list() });

  const inv = () => qc.invalidateQueries({ queryKey: ['schedules'] });
  const createM = useMutation({ mutationFn: schedulesApi.create, onSuccess: () => { inv(); closeModal(); } });
  const updateM = useMutation({ mutationFn: ({ id, data }: { id: number; data: ScheduleRequest }) => schedulesApi.update(id, data), onSuccess: () => { inv(); closeModal(); } });
  const deleteM = useMutation({ mutationFn: schedulesApi.delete, onSuccess: inv });
  const toggleM = useMutation({ mutationFn: schedulesApi.toggleComplete, onSuccess: inv });

  function openModal(s?: ScheduleResponse, defaultDate?: Date) {
    setEditing(s ?? null);
    if (s) {
      setForm({ title: s.title, type: s.type, scheduledAt: s.scheduledAt.slice(0, 16), location: s.location ?? '', memo: s.memo ?? '', jobPostingId: s.jobPostingId });
    } else {
      const base = defaultDate ? new Date(defaultDate) : new Date();
      base.setHours(9, 0, 0, 0);
      setForm({ ...DEF, scheduledAt: base.toISOString().slice(0, 16) });
    }
    setShowModal(true);
  }
  function closeModal() { setShowModal(false); setEditing(null); }
  function submit(e: React.FormEvent) { e.preventDefault(); editing ? updateM.mutate({ id: editing.id, data: form }) : createM.mutate(form); }
  function delSchedule(s: ScheduleResponse) { if (confirm(`"${s.title}" 일정을 삭제하시겠습니까?`)) deleteM.mutate(s.id); }

  const sf = (k: keyof ScheduleRequest) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value || null }));

  const isLoading = viewMode === 'list' ? listLoading : calLoading;

  return (
    <div>
      <PageHeader
        title="일정"
        action={
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex rounded-lg border border-gray-200 bg-white overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <List className="w-3.5 h-3.5" />목록
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'calendar' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <CalendarDays className="w-3.5 h-3.5" />달력
              </button>
            </div>
            <Btn onClick={() => openModal()}><Plus className="w-4 h-4" />일정 추가</Btn>
          </div>
        }
      />

      {/* ── List view ── */}
      {viewMode === 'list' && (
        <>
          <div className="flex gap-1.5 mb-5 flex-wrap">
            {(['UPCOMING', 'ALL', ...TYPES.map(t => t.value)] as const).map(t => (
              <button key={t} onClick={() => setFilter(t as typeof filter)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === t ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm border border-gray-200'}`}>
                {t === 'UPCOMING' ? '다가오는 일정' : t === 'ALL' ? '전체' : TYPES.find(tp => tp.value === t)?.label ?? t}
              </button>
            ))}
          </div>
          {isLoading ? <Spinner /> : listFiltered.length === 0 ? <Empty message="등록된 일정이 없습니다" /> : (
            <div className="space-y-2">
              {listFiltered.map(s => (
                <ScheduleRow key={s.id} s={s} onEdit={openModal} onDelete={delSchedule} onToggle={id => toggleM.mutate(id)} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Calendar view ── */}
      {viewMode === 'calendar' && (
        isLoading ? <Spinner /> : (
          <CalendarView
            list={allSchedules}
            onAdd={date => openModal(undefined, date)}
            onEdit={openModal}
            onDelete={delSchedule}
            onToggle={id => toggleM.mutate(id)}
          />
        )
      )}

      {/* ── Modal ── */}
      <Modal isOpen={showModal} onClose={closeModal} title={editing ? '일정 수정' : '일정 추가'}>
        <form onSubmit={submit} className="space-y-4">
          <Field label="제목" required><Input value={form.title} onChange={sf('title')} required placeholder="일정 제목" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="유형">
              <Select value={form.type} onChange={sf('type')}>{TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</Select>
            </Field>
            <Field label="날짜/시간" required><Input type="datetime-local" value={form.scheduledAt} onChange={sf('scheduledAt')} required /></Field>
          </div>
          <Field label="연결 공고">
            <Select value={form.jobPostingId ?? ''} onChange={e => setForm(f => ({ ...f, jobPostingId: e.target.value ? Number(e.target.value) : null }))}>
              <option value="">공고 선택 (선택사항)</option>
              {postings.map(p => <option key={p.id} value={p.id}>{p.title}{p.companyName ? ` · ${p.companyName}` : ''}</option>)}
            </Select>
          </Field>
          <Field label="장소"><Input value={form.location ?? ''} onChange={sf('location')} placeholder="장소 또는 링크" /></Field>
          <Field label="메모"><Textarea value={form.memo ?? ''} onChange={sf('memo')} placeholder="메모를 입력하세요" /></Field>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Btn type="button" variant="secondary" onClick={closeModal}>취소</Btn>
            <Btn type="submit" disabled={createM.isPending || updateM.isPending}>저장</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
