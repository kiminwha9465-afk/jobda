import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, ExternalLink, ChevronRight, Search, Download, CheckCircle2, Play, RefreshCw } from 'lucide-react';
import { jobPostingsApi, companiesApi, saraminApi } from '../api';
import type { JobPostingResponse, ApplicationStatus, JobPostingRequest, SaraminJob, SaraminImportRequest } from '../types';
import { Modal, Field, Input, Textarea, Select, Btn, Spinner, Empty, StatusBadge, TagBadge, PageHeader } from '../components/ui';

const STATUSES: ApplicationStatus[] = ['INTERESTED','PLAN_TO_APPLY','APPLIED','DOCUMENT_PASS','INTERVIEW_1','INTERVIEW_2','FINAL_PASS','REJECTED','WITHDRAWN'];
const LABELS: Record<ApplicationStatus, string> = { INTERESTED:'관심', PLAN_TO_APPLY:'지원예정', APPLIED:'지원완료', DOCUMENT_PASS:'서류합격', INTERVIEW_1:'1차면접', INTERVIEW_2:'2차면접', FINAL_PASS:'최종합격', REJECTED:'불합격', WITHDRAWN:'취소' };
const PIPELINE: ApplicationStatus[] = ['INTERESTED','PLAN_TO_APPLY','APPLIED','DOCUMENT_PASS','INTERVIEW_1','INTERVIEW_2','FINAL_PASS'];

const DEF: JobPostingRequest = { title:'', companyId:null, url:'', deadline:null, status:'INTERESTED', jobType:'', department:'', memo:'' };
const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('ko-KR') : '-';
const fmtDate = (d: string | null) => d && d.length >= 10 ? d.substring(0, 10) : null;
const fmtCollected = (d: string | null) => d ? new Date(d).toLocaleDateString('ko-KR') : null;

export default function JobPostings() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<ApplicationStatus | 'ALL'>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [showSaramin, setShowSaramin] = useState(false);
  const [editing, setEditing] = useState<JobPostingResponse | null>(null);
  const [form, setForm] = useState<JobPostingRequest>(DEF);

  // 사람인 state
  const [searchInput, setSearchInput] = useState('');
  const [activeKeyword, setActiveKeyword] = useState('');
  const [count, setCount] = useState(20);
  const [newKw, setNewKw] = useState('');
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const { data: list = [], isLoading } = useQuery({ queryKey: ['job-postings', filter], queryFn: () => jobPostingsApi.list(filter !== 'ALL' ? { status: filter } : undefined) });
  const { data: companies = [] } = useQuery({ queryKey: ['companies'], queryFn: () => companiesApi.list() });

  const { data: saraminResults = [], isLoading: searching, error: searchError } = useQuery({
    queryKey: ['saramin-search', activeKeyword, count],
    queryFn: () => saraminApi.search(activeKeyword, count),
    enabled: activeKeyword.trim().length > 0,
    retry: false,
  });
  const { data: keywords = [] } = useQuery({ queryKey: ['saramin-keywords'], queryFn: () => saraminApi.keywords() });

  const inv = () => qc.invalidateQueries({ queryKey: ['job-postings'] });
  const invAll = () => { inv(); qc.invalidateQueries({ queryKey: ['dashboard'] }); };

  const createM = useMutation({ mutationFn: jobPostingsApi.create, onSuccess: () => { inv(); close(); } });
  const updateM = useMutation({ mutationFn: ({ id, data }: { id: number; data: JobPostingRequest }) => jobPostingsApi.update(id, data), onSuccess: () => { inv(); close(); } });
  const statusM = useMutation({ mutationFn: ({ id, status }: { id: number; status: ApplicationStatus }) => jobPostingsApi.updateStatus(id, status), onSuccess: inv });
  const deleteM = useMutation({ mutationFn: jobPostingsApi.delete, onSuccess: inv });

  const importM = useMutation({
    mutationFn: saraminApi.importJob,
    onSuccess: (_, req) => { setSavedIds(s => new Set(s).add(req.saraminId)); invAll(); },
  });
  const importAllM = useMutation({
    mutationFn: (reqs: SaraminImportRequest[]) => saraminApi.importAll(reqs),
    onSuccess: (n) => {
      saraminResults.forEach(r => setSavedIds(s => new Set(s).add(r.saraminId)));
      alert(`${n}개 공고가 저장됐습니다.`);
      invAll();
    },
  });
  const addKwM = useMutation({
    mutationFn: (kw: string) => saraminApi.addKeyword(kw),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['saramin-keywords'] }); setNewKw(''); },
    onError: () => alert('이미 등록된 키워드입니다.'),
  });
  const delKwM = useMutation({
    mutationFn: saraminApi.deleteKeyword,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saramin-keywords'] }),
  });
  const collectM = useMutation({
    mutationFn: saraminApi.collect,
    onSuccess: (n) => { alert(`새 공고 ${n}개가 수집됐습니다.`); invAll(); qc.invalidateQueries({ queryKey: ['saramin-keywords'] }); },
    onError: () => alert('수집 실패: API 키를 확인해주세요.'),
  });

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

  function handleSaraminSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setSavedIds(new Set());
    setActiveKeyword(searchInput.trim());
  }
  function toReq(job: SaraminJob): SaraminImportRequest {
    return { saraminId: job.saraminId, title: job.title, companyName: job.companyName, url: job.url, location: job.location ?? undefined, jobType: job.jobType ?? undefined, industry: job.industry ?? undefined, experienceLevel: job.experienceLevel ?? undefined, expirationDate: job.expirationDate ?? undefined };
  }
  function handleImportAll() {
    const toImport = saraminResults.filter(r => !isSaved(r));
    if (!toImport.length) { alert('저장할 공고가 없습니다.'); return; }
    importAllM.mutate(toImport.map(toReq));
  }
  const isSaved = (job: SaraminJob) => job.alreadySaved || savedIds.has(job.saraminId);

  return (
    <div>
      <PageHeader title="채용공고" action={
        <div className="flex gap-2">
          <Btn variant="secondary" onClick={() => setShowSaramin(true)}><Search className="w-4 h-4" />사람인 검색</Btn>
          <Btn onClick={() => open()}><Plus className="w-4 h-4" />공고 추가</Btn>
        </div>
      } />

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

      {/* 공고 추가/수정 모달 */}
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

      {/* 사람인 검색 모달 */}
      <Modal isOpen={showSaramin} onClose={() => setShowSaramin(false)} title="사람인 공고 검색" size="xl">
        <div className="space-y-5">
          {/* 검색 */}
          <div>
            <form onSubmit={handleSaraminSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder="직무, 기술스택으로 검색  (예: 백엔드, Spring)"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <select
                value={count}
                onChange={e => setCount(Number(e.target.value))}
                className="px-3 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-400 bg-white"
              >
                {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}개</option>)}
              </select>
              <Btn type="submit"><Search className="w-4 h-4" />검색</Btn>
            </form>
          </div>

          {/* 자동 수집 키워드 */}
          <div className="border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">자동 수집 키워드</p>
                <p className="text-xs text-gray-400">매일 오전 9시 자동 수집</p>
              </div>
              <Btn variant="secondary" onClick={() => collectM.mutate()} disabled={collectM.isPending || keywords.length === 0}>
                {collectM.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                {collectM.isPending ? '수집 중...' : '지금 수집'}
              </Btn>
            </div>
            <div className="flex gap-2 mb-3">
              <input
                value={newKw}
                onChange={e => setNewKw(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (newKw.trim()) addKwM.mutate(newKw.trim()); } }}
                placeholder="키워드 입력 후 Enter"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-400"
              />
              <Btn onClick={() => newKw.trim() && addKwM.mutate(newKw.trim())} disabled={!newKw.trim() || addKwM.isPending}>
                <Plus className="w-4 h-4" />추가
              </Btn>
            </div>
            {keywords.length === 0
              ? <p className="text-xs text-gray-400 text-center py-1">등록된 키워드가 없습니다</p>
              : (
                <div className="flex flex-wrap gap-2">
                  {keywords.map(kw => (
                    <div key={kw.id} className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full">
                      <span className="text-sm font-medium text-blue-700">{kw.keyword}</span>
                      {fmtCollected(kw.lastCollectedAt) && <span className="text-xs text-blue-400">{fmtCollected(kw.lastCollectedAt)} 수집</span>}
                      <button onClick={() => delKwM.mutate(kw.id)} className="text-blue-300 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              )
            }
          </div>

          {/* 검색 결과 */}
          {activeKeyword && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-800">
                  "{activeKeyword}" 검색 결과
                  {saraminResults.length > 0 && <span className="text-sm font-normal text-gray-400 ml-2">{saraminResults.length}개</span>}
                </p>
                {saraminResults.length > 0 && (
                  <Btn variant="secondary" onClick={handleImportAll} disabled={importAllM.isPending}>
                    <Download className="w-3.5 h-3.5" />{importAllM.isPending ? '저장 중...' : '전체 저장'}
                  </Btn>
                )}
              </div>
              {searching ? <Spinner /> : searchError ? (
                <div className="bg-red-50 text-red-600 rounded-xl p-4 text-sm text-center">
                  검색 실패: API 키를 확인해주세요.
                </div>
              ) : saraminResults.length === 0 ? <Empty message="검색 결과가 없습니다" /> : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {saraminResults.map(job => (
                    <div key={job.saraminId}
                      className={`border border-gray-200 rounded-xl p-4 flex flex-col gap-2.5 transition-opacity ${isSaved(job) ? 'opacity-50' : ''}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">{job.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{job.companyName}</p>
                        </div>
                        {isSaved(job) ? (
                          <span className="shrink-0 flex items-center gap-1 text-xs text-emerald-500 font-medium">
                            <CheckCircle2 className="w-4 h-4" />저장됨
                          </span>
                        ) : (
                          <button
                            onClick={() => importM.mutate(toReq(job))}
                            disabled={importM.isPending}
                            className="shrink-0 flex items-center gap-1 text-xs text-blue-600 font-medium px-2.5 py-1 rounded-lg hover:bg-blue-50 border border-blue-100"
                          >
                            <Download className="w-3.5 h-3.5" />저장
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {job.location && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{job.location}</span>}
                        {job.jobType && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{job.jobType}</span>}
                        {job.experienceLevel && <span className="text-xs bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full">{job.experienceLevel}</span>}
                        {job.industry && <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">{job.industry}</span>}
                        {fmtDate(job.expirationDate) && <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full">~{fmtDate(job.expirationDate)}</span>}
                      </div>
                      <a href={job.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-gray-300 hover:text-blue-500 truncate">
                        <ExternalLink className="w-3 h-3 shrink-0" />공고 원문 보기
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
