import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, ExternalLink, ChevronRight } from 'lucide-react';
import { jobPostingsApi, companiesApi } from '../api';
import type { JobPostingResponse, ApplicationStatus, JobPostingRequest } from '../types';
import { Modal, Field, Input, Textarea, Select, Btn, Spinner, Empty, StatusBadge, TagBadge, PageHeader } from '../components/ui';

const STATUSES: ApplicationStatus[] = ['INTERESTED','PLAN_TO_APPLY','APPLIED','DOCUMENT_PASS','INTERVIEW_1','INTERVIEW_2','FINAL_PASS','REJECTED','WITHDRAWN'];
const LABELS: Record<ApplicationStatus, string> = { INTERESTED:'관심', PLAN_TO_APPLY:'지원예정', APPLIED:'지원완료', DOCUMENT_PASS:'서류합격', INTERVIEW_1:'1차면접', INTERVIEW_2:'2차면접', FINAL_PASS:'최종합격', REJECTED:'불합격', WITHDRAWN:'취소' };
const PIPELINE: ApplicationStatus[] = ['INTERESTED','PLAN_TO_APPLY','APPLIED','DOCUMENT_PASS','INTERVIEW_1','INTERVIEW_2','FINAL_PASS'];

const DEF: JobPostingRequest = { title:'', companyId:null, url:'', deadline:null, status:'INTERESTED', jobType:'', department:'', memo:'' };
const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('ko-KR') : '-';

export default function JobPostings() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<ApplicationStatus | 'ALL'>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<JobPostingResponse | null>(null);
  const [form, setForm] = useState<JobPostingRequest>(DEF);

  const { data: list = [], isLoading } = useQuery({ queryKey: ['job-postings', filter], queryFn: () => jobPostingsApi.list(filter !== 'ALL' ? { status: filter } : undefined) });
  const { data: companies = [] } = useQuery({ queryKey: ['companies'], queryFn: () => companiesApi.list() });

  const inv = () => qc.invalidateQueries({ queryKey: ['job-postings'] });
  const createM = useMutation({ mutationFn: jobPostingsApi.create, onSuccess: () => { inv(); close(); } });
  const updateM = useMutation({ mutationFn: ({ id, data }: { id: number; data: JobPostingRequest }) => jobPostingsApi.update(id, data), onSuccess: () => { inv(); close(); } });
  const statusM = useMutation({ mutationFn: ({ id, status }: { id: number; status: ApplicationStatus }) => jobPostingsApi.updateStatus(id, status), onSuccess: inv });
  const deleteM = useMutation({ mutationFn: jobPostingsApi.delete, onSuccess: inv });

  function open(jp?: JobPostingResponse) {
    setEditing(jp ?? null);
    setForm(jp ? { title: jp.title, companyId: jp.companyId, url: jp.url ?? '', deadline: jp.deadline, status: jp.status, jobType: jp.jobType ?? '', department: jp.department ?? '', memo: jp.memo ?? '' } : DEF);
    setShowModal(true);
  }
  function close() { setShowModal(false); setEditing(null); }
  function submit(e: React.FormEvent) { e.preventDefault(); editing ? updateM.mutate({ id: editing.id, data: form }) : createM.mutate(form); }
  function del(jp: JobPostingResponse) { if (confirm(`"${jp.title}" 공고를 삭제하시겠습니까?`)) deleteM.mutate(jp.id); }
  function nextStatus(s: ApplicationStatus) { const i = PIPELINE.indexOf(s); return i !== -1 && i < PIPELINE.length - 1 ? PIPELINE[i + 1] : null; }

  const s = (k: keyof JobPostingRequest) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value || null }));

  return (
    <div>
      <PageHeader title="채용공고" action={<Btn onClick={() => open()}><Plus className="w-4 h-4" />공고 추가</Btn>} />

      <div className="flex gap-1.5 mb-5 flex-wrap">
        {(['ALL', ...STATUSES] as const).map(st => (
          <button key={st} onClick={() => setFilter(st)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === st ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm border border-gray-200'}`}>
            {st === 'ALL' ? '전체' : LABELS[st]}
          </button>
        ))}
      </div>

      {isLoading ? <Spinner /> : list.length === 0 ? <Empty message="등록된 공고가 없습니다" /> : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b"><tr>
              {['공고명', '기업', '상태', '마감일', '태그', ''].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y">
              {list.map(jp => (
                <tr key={jp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 font-medium text-gray-900">
                      {jp.title}
                      {jp.url && <a href={jp.url} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-blue-500"><ExternalLink className="w-3 h-3" /></a>}
                    </div>
                    {jp.department && <p className="text-xs text-gray-400">{jp.department}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{jp.companyName ?? '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <StatusBadge status={jp.status} />
                      {nextStatus(jp.status) && (
                        <button onClick={() => statusM.mutate({ id: jp.id, status: nextStatus(jp.status)! })}
                          title={`→ ${LABELS[nextStatus(jp.status)!]}`}
                          className="p-0.5 rounded text-gray-300 hover:text-blue-500 hover:bg-blue-50">
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{fmt(jp.deadline)}</td>
                  <td className="px-4 py-3"><div className="flex gap-1 flex-wrap">{jp.tags.map(t => <TagBadge key={t.id} name={t.name} color={t.color} />)}</div></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => open(jp)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => del(jp)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showModal} onClose={close} title={editing ? '공고 수정' : '공고 추가'}>
        <form onSubmit={submit} className="space-y-4">
          <Field label="공고명" required><Input value={form.title} onChange={s('title')} required placeholder="공고명을 입력하세요" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="기업">
              <Select value={form.companyId ?? ''} onChange={e => setForm(f => ({ ...f, companyId: e.target.value ? Number(e.target.value) : null }))}>
                <option value="">기업 선택</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            <Field label="상태">
              <Select value={form.status ?? 'INTERESTED'} onChange={s('status')}>
                {STATUSES.map(st => <option key={st} value={st}>{LABELS[st]}</option>)}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="직무유형"><Input value={form.jobType ?? ''} onChange={s('jobType')} placeholder="정규직, 인턴 등" /></Field>
            <Field label="부서"><Input value={form.department ?? ''} onChange={s('department')} placeholder="개발팀 등" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="마감일"><Input type="date" value={form.deadline ?? ''} onChange={s('deadline')} /></Field>
            <Field label="공고 URL"><Input type="url" value={form.url ?? ''} onChange={s('url')} placeholder="https://" /></Field>
          </div>
          <Field label="메모"><Textarea value={form.memo ?? ''} onChange={s('memo')} placeholder="메모를 입력하세요" /></Field>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Btn type="button" variant="secondary" onClick={close}>취소</Btn>
            <Btn type="submit" disabled={createM.isPending || updateM.isPending}>저장</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
