import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search as SearchIcon, Building2, Briefcase, FileText, ClipboardList } from 'lucide-react';
import { searchApi } from '../api';
import type { CompanyResponse, JobPostingResponse, CoverLetterResponse, ResumeResponse } from '../types';
import { Spinner, StatusBadge, TagBadge } from '../components/ui';

type Tab = 'all' | 'companies' | 'jobPostings' | 'coverLetters' | 'resumes';

const fmt = (d: string) => new Date(d).toLocaleDateString('ko-KR');

function CompanyCard({ c }: { c: CompanyResponse }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex items-start justify-between">
        <div><p className="font-medium text-gray-900">{c.name}</p><p className="text-xs text-gray-400 mt-0.5">{[c.industry, c.size, c.location].filter(Boolean).join(' · ')}</p></div>
        <div className="flex gap-1">{c.tags.map(t => <TagBadge key={t.id} name={t.name} color={t.color} />)}</div>
      </div>
      {c.memo && <p className="text-xs text-gray-500 mt-2 line-clamp-2">{c.memo}</p>}
    </div>
  );
}

function PostingCard({ jp }: { jp: JobPostingResponse }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0"><p className="font-medium text-gray-900 truncate">{jp.title}</p><p className="text-xs text-gray-400 mt-0.5">{jp.companyName}</p></div>
        <StatusBadge status={jp.status} />
      </div>
      <div className="flex items-center gap-2 mt-2">
        <div className="flex gap-1">{jp.tags.map(t => <TagBadge key={t.id} name={t.name} color={t.color} />)}</div>
        {jp.deadline && <span className="text-xs text-gray-400 ml-auto">마감 {fmt(jp.deadline)}</span>}
      </div>
    </div>
  );
}

function CoverLetterCard({ cl }: { cl: CoverLetterResponse }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex items-center gap-2"><p className="font-medium text-gray-900">{cl.title}</p><span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">v{cl.version}</span></div>
      <p className="text-xs text-gray-400 mt-0.5">{[cl.companyName, cl.targetPosition].filter(Boolean).join(' · ')} · 문항 {cl.items.length}개</p>
      <div className="flex gap-1 mt-2">{cl.tags.map(t => <TagBadge key={t.id} name={t.name} color={t.color} />)}</div>
    </div>
  );
}

function ResumeCard({ r }: { r: ResumeResponse }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex items-center gap-2">
        <p className="font-medium text-gray-900">{r.title}</p>
        <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{r.typeLabel}</span>
        <span className="text-xs text-gray-400">v{r.version}</span>
      </div>
      <p className="text-xs text-gray-400 mt-0.5">{[r.targetCompany, r.targetPosition].filter(Boolean).join(' · ')}</p>
      <div className="flex gap-1 mt-2">{r.tags.map(t => <TagBadge key={t.id} name={t.name} color={t.color} />)}</div>
    </div>
  );
}

export default function Search() {
  const [searchParams] = useSearchParams();
  const initialQ = searchParams.get('q') ?? '';
  const [input, setInput] = useState(initialQ);
  const [keyword, setKeyword] = useState(initialQ);
  const [tab, setTab] = useState<Tab>('all');

  useEffect(() => {
    const q = searchParams.get('q') ?? '';
    setInput(q);
    setKeyword(q);
    setTab('all');
  }, [searchParams]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['search', keyword],
    queryFn: () => searchApi.search(keyword),
    enabled: keyword.trim().length > 0,
  });

  function handleSubmit(e: React.FormEvent) { e.preventDefault(); setKeyword(input.trim()); setTab('all'); }

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { key: 'all', label: '전체', icon: <SearchIcon className="w-3.5 h-3.5" />, count: data?.totalCount ?? 0 },
    { key: 'companies', label: '기업', icon: <Building2 className="w-3.5 h-3.5" />, count: data?.companies.length ?? 0 },
    { key: 'jobPostings', label: '공고', icon: <Briefcase className="w-3.5 h-3.5" />, count: data?.jobPostings.length ?? 0 },
    { key: 'coverLetters', label: '자소서', icon: <FileText className="w-3.5 h-3.5" />, count: data?.coverLetters.length ?? 0 },
    { key: 'resumes', label: '이력서', icon: <ClipboardList className="w-3.5 h-3.5" />, count: data?.resumes.length ?? 0 },
  ];

  const showCompanies = (tab === 'all' || tab === 'companies') && (data?.companies.length ?? 0) > 0;
  const showPostings = (tab === 'all' || tab === 'jobPostings') && (data?.jobPostings.length ?? 0) > 0;
  const showCoverLetters = (tab === 'all' || tab === 'coverLetters') && (data?.coverLetters.length ?? 0) > 0;
  const showResumes = (tab === 'all' || tab === 'resumes') && (data?.resumes.length ?? 0) > 0;
  const noResults = data && data.totalCount === 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">통합 검색</h1>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={input} onChange={e => setInput(e.target.value)}
            placeholder="기업, 공고, 자소서, 이력서를 한번에 검색하세요..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
        </div>
        <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors">검색</button>
      </form>

      {keyword && data && (
        <div className="flex gap-1.5 mb-5 flex-wrap">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${tab === t.key ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm border border-gray-200'}`}>
              {t.icon}{t.label}
              {t.count > 0 && <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-xs ${tab === t.key ? 'bg-blue-500' : 'bg-gray-100 text-gray-500'}`}>{t.count}</span>}
            </button>
          ))}
        </div>
      )}

      {(isLoading || isFetching) && <Spinner />}

      {!keyword && !isLoading && (
        <div className="text-center py-20 text-gray-400">
          <SearchIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">검색어를 입력해 기업, 공고, 자소서, 이력서를 한번에 찾아보세요</p>
        </div>
      )}

      {noResults && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-sm">"{keyword}"에 대한 검색 결과가 없습니다</p>
        </div>
      )}

      {data && !isFetching && (
        <div className="space-y-6">
          {showCompanies && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 flex items-center gap-1.5 mb-3"><Building2 className="w-4 h-4" />기업 ({data.companies.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{data.companies.map(c => <CompanyCard key={c.id} c={c} />)}</div>
            </section>
          )}
          {showPostings && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 flex items-center gap-1.5 mb-3"><Briefcase className="w-4 h-4" />채용공고 ({data.jobPostings.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{data.jobPostings.map(jp => <PostingCard key={jp.id} jp={jp} />)}</div>
            </section>
          )}
          {showCoverLetters && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 flex items-center gap-1.5 mb-3"><FileText className="w-4 h-4" />자소서 ({data.coverLetters.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{data.coverLetters.map(cl => <CoverLetterCard key={cl.id} cl={cl} />)}</div>
            </section>
          )}
          {showResumes && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 flex items-center gap-1.5 mb-3"><ClipboardList className="w-4 h-4" />이력서 ({data.resumes.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{data.resumes.map(r => <ResumeCard key={r.id} r={r} />)}</div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
