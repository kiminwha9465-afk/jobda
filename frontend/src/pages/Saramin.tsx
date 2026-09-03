import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Trash2, Download, CheckCircle2, Play, ExternalLink, RefreshCw } from 'lucide-react';
import { saraminApi } from '../api';
import type { SaraminJob, SaraminImportRequest } from '../types';
import { Btn, Spinner, Empty, PageHeader } from '../components/ui';

const fmtDate = (d: string | null) => (d && d.length >= 10 ? d.substring(0, 10) : null);
const fmtCollected = (d: string | null) => d ? new Date(d).toLocaleDateString('ko-KR') : null;

export default function Saramin() {
  const qc = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const [activeKeyword, setActiveKeyword] = useState('');
  const [count, setCount] = useState(20);
  const [newKw, setNewKw] = useState('');
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const { data: results = [], isLoading: searching, error: searchError } = useQuery({
    queryKey: ['saramin-search', activeKeyword, count],
    queryFn: () => saraminApi.search(activeKeyword, count),
    enabled: activeKeyword.trim().length > 0,
    retry: false,
  });

  const { data: keywords = [] } = useQuery({
    queryKey: ['saramin-keywords'],
    queryFn: () => saraminApi.keywords(),
  });

  const importM = useMutation({
    mutationFn: saraminApi.importJob,
    onSuccess: (_, req) => {
      setSavedIds(s => new Set(s).add(req.saraminId));
      qc.invalidateQueries({ queryKey: ['job-postings'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const importAllM = useMutation({
    mutationFn: (reqs: SaraminImportRequest[]) => saraminApi.importAll(reqs),
    onSuccess: (n) => {
      results.forEach(r => setSavedIds(s => new Set(s).add(r.saraminId)));
      alert(`${n}개 공고가 채용공고 목록에 저장됐습니다.`);
      qc.invalidateQueries({ queryKey: ['job-postings'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
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
    onSuccess: (n) => {
      alert(`새 공고 ${n}개가 자동 수집되어 저장됐습니다.`);
      qc.invalidateQueries({ queryKey: ['job-postings'] });
      qc.invalidateQueries({ queryKey: ['saramin-keywords'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: () => alert('수집 실패: API 키를 확인해주세요.'),
  });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setSavedIds(new Set());
    setActiveKeyword(searchInput.trim());
  }

  function toReq(job: SaraminJob): SaraminImportRequest {
    return {
      saraminId: job.saraminId,
      title: job.title,
      companyName: job.companyName,
      url: job.url,
      location: job.location ?? undefined,
      jobType: job.jobType ?? undefined,
      industry: job.industry ?? undefined,
      experienceLevel: job.experienceLevel ?? undefined,
      expirationDate: job.expirationDate ?? undefined,
    };
  }

  function handleImportAll() {
    const toImport = results.filter(r => !isSaved(r));
    if (!toImport.length) { alert('저장할 공고가 없습니다.'); return; }
    importAllM.mutate(toImport.map(toReq));
  }

  const isSaved = (job: SaraminJob) => job.alreadySaved || savedIds.has(job.saraminId);

  return (
    <div className="space-y-6">
      <PageHeader title="사람인 공고 수집" />

      {/* ── 검색 ── */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="font-semibold text-gray-900 mb-4">공고 검색</h2>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="직무, 기술스택으로 검색  (예: 백엔드, Spring, 프론트엔드)"
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

      {/* ── 자동 수집 키워드 ── */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-900">자동 수집 키워드</h2>
            <p className="text-xs text-gray-400 mt-0.5">매일 오전 9시에 등록된 키워드로 새 공고를 자동 수집합니다</p>
          </div>
          <Btn variant="secondary" onClick={() => collectM.mutate()} disabled={collectM.isPending || keywords.length === 0}>
            {collectM.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            {collectM.isPending ? '수집 중...' : '지금 수집'}
          </Btn>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            value={newKw}
            onChange={e => setNewKw(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (newKw.trim()) addKwM.mutate(newKw.trim()); } }}
            placeholder="키워드 입력 (Enter 또는 추가 클릭)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-400"
          />
          <Btn onClick={() => newKw.trim() && addKwM.mutate(newKw.trim())} disabled={!newKw.trim() || addKwM.isPending}>
            <Plus className="w-4 h-4" />추가
          </Btn>
        </div>

        {keywords.length === 0
          ? <p className="text-sm text-gray-400 text-center py-3">등록된 키워드가 없습니다</p>
          : (
            <div className="flex flex-wrap gap-2">
              {keywords.map(kw => (
                <div key={kw.id} className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full">
                  <span className="text-sm font-medium text-blue-700">{kw.keyword}</span>
                  {fmtCollected(kw.lastCollectedAt) && (
                    <span className="text-xs text-blue-400">{fmtCollected(kw.lastCollectedAt)} 수집</span>
                  )}
                  <button onClick={() => delKwM.mutate(kw.id)} className="text-blue-300 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )
        }
      </div>

      {/* ── 검색 결과 ── */}
      {activeKeyword && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">
              "{activeKeyword}" 검색 결과
              {results.length > 0 && <span className="text-sm font-normal text-gray-400 ml-2">{results.length}개</span>}
            </h2>
            {results.length > 0 && (
              <Btn variant="secondary" onClick={handleImportAll} disabled={importAllM.isPending}>
                <Download className="w-3.5 h-3.5" />
                {importAllM.isPending ? '저장 중...' : '전체 저장'}
              </Btn>
            )}
          </div>

          {searching ? <Spinner /> : searchError ? (
            <div className="bg-red-50 text-red-600 rounded-xl p-5 text-sm text-center">
              검색 실패: API 키를 확인해주세요.<br />
              <span className="text-xs text-red-400 mt-1 block">application.properties의 saramin.access-key를 설정해야 합니다</span>
            </div>
          ) : results.length === 0 ? <Empty message="검색 결과가 없습니다" /> : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {results.map(job => (
                <div key={job.saraminId}
                  className={`bg-white rounded-xl shadow-sm p-4 flex flex-col gap-2.5 transition-opacity ${isSaved(job) ? 'opacity-50' : ''}`}>
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
                        className="shrink-0 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium px-2.5 py-1 rounded-lg hover:bg-blue-50 transition-colors border border-blue-100"
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
                    {fmtDate(job.expirationDate) && (
                      <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full">~{fmtDate(job.expirationDate)}</span>
                    )}
                  </div>

                  <a href={job.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-gray-300 hover:text-blue-500 transition-colors truncate">
                    <ExternalLink className="w-3 h-3 shrink-0" />공고 원문 보기
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
