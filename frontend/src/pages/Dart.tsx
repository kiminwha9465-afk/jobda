import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Download, CheckCircle2, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { dartApi, companiesApi } from '../api';
import type { DartCompany } from '../types';
import { Btn, Spinner, Empty, PageHeader } from '../components/ui';

const CLS_BADGE: Record<string, string> = {
  '코스피': 'bg-blue-50 text-blue-600',
  '코스닥': 'bg-violet-50 text-violet-600',
  '코넥스': 'bg-orange-50 text-orange-600',
  '비상장': 'bg-gray-100 text-gray-500',
};

export default function Dart() {
  const qc = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [expandedCode, setExpandedCode] = useState<string | null>(null);
  const [savedCodes, setSavedCodes] = useState<Set<string>>(new Set());

  const { data: savedCompanies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companiesApi.list(),
  });

  const sortedSaved = [...savedCompanies].sort((a, b) => a.name.localeCompare(b.name, 'ko'));

  const { data: results = [], isLoading, error } = useQuery({
    queryKey: ['dart-search', activeQuery],
    queryFn: () => dartApi.search(activeQuery),
    enabled: activeQuery.trim().length > 0,
    retry: false,
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['dart-detail', expandedCode],
    queryFn: () => dartApi.detail(expandedCode!),
    enabled: !!expandedCode,
    retry: false,
  });

  const saveM = useMutation({
    mutationFn: (company: DartCompany) =>
      dartApi.save({
        corpName: company.corpName,
        indutyCode: company.indutyCode,
        address: company.address,
        website: company.website,
        corpCls: company.corpCls,
      }),
    onSuccess: (_, company) => {
      setSavedCodes(s => new Set(s).add(company.corpCode));
      qc.invalidateQueries({ queryKey: ['companies'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const saveDetailM = useMutation({
    mutationFn: () =>
      dartApi.save({
        corpName: detail!.corpName,
        indutyCode: detail!.indutyCode,
        address: detail!.address,
        website: detail!.website,
        corpCls: detail!.corpCls,
      }),
    onSuccess: () => {
      setSavedCodes(s => new Set(s).add(expandedCode!));
      qc.invalidateQueries({ queryKey: ['companies'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setSavedCodes(new Set());
    setExpandedCode(null);
    setActiveQuery(searchInput.trim());
  }

  function toggleExpand(corpCode: string) {
    setExpandedCode(prev => (prev === corpCode ? null : corpCode));
  }

  const isSaved = (c: DartCompany) => c.alreadySaved || savedCodes.has(c.corpCode);

  return (
    <div className="space-y-6">
      <PageHeader title="DART 기업 검색" />

      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="font-semibold text-gray-900 mb-4">기업 검색</h2>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="기업명으로 검색  (예: 삼성전자, 카카오, 네이버)"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <Btn type="submit"><Search className="w-4 h-4" />검색</Btn>
        </form>
        <p className="text-xs text-gray-400 mt-2">금융감독원 DART 공시 데이터를 기반으로 상장·비상장 기업 정보를 조회합니다.</p>
      </div>

      {!activeQuery && (
        <div>
          <h2 className="font-semibold text-gray-900 mb-3">
            내 기업 목록
            {sortedSaved.length > 0 && <span className="text-sm font-normal text-gray-400 ml-2">{sortedSaved.length}개</span>}
          </h2>
          {sortedSaved.length === 0 ? (
            <Empty message="저장된 기업이 없습니다. DART에서 검색 후 저장해보세요." />
          ) : (
            <div className="space-y-2">
              {sortedSaved.map(company => (
                <div key={company.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{company.name}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {company.industry && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{company.industry}</span>}
                      {company.location && <span className="text-xs bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full">{company.location}</span>}
                      {company.size && <span className="text-xs bg-violet-50 text-violet-500 px-2 py-0.5 rounded-full">{company.size}</span>}
                    </div>
                  </div>
                  {company.website && (
                    <a
                      href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-gray-300 hover:text-blue-500 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeQuery && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">
              "{activeQuery}" 검색 결과
              {results.length > 0 && <span className="text-sm font-normal text-gray-400 ml-2">{results.length}개</span>}
            </h2>
          </div>

          {isLoading ? <Spinner /> : error ? (
            <div className="bg-red-50 text-red-600 rounded-xl p-5 text-sm text-center">
              검색 실패: DART API 키를 확인해주세요.
            </div>
          ) : results.length === 0 ? <Empty message="검색 결과가 없습니다" /> : (
            <div className="space-y-2">
              {results.map(company => (
                <div key={company.corpCode} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="flex items-center gap-3 p-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 text-sm">{company.corpName}</span>
                        {company.corpCls && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CLS_BADGE[company.corpCls] ?? 'bg-gray-100 text-gray-500'}`}>
                            {company.corpCls}
                          </span>
                        )}
                        {company.stockCode && (
                          <span className="text-xs text-gray-400">{company.stockCode}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isSaved(company) ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-500 font-medium">
                          <CheckCircle2 className="w-4 h-4" />저장됨
                        </span>
                      ) : (
                        <button
                          onClick={() => saveM.mutate(company)}
                          disabled={saveM.isPending}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium px-2.5 py-1 rounded-lg hover:bg-blue-50 transition-colors border border-blue-100"
                        >
                          <Download className="w-3.5 h-3.5" />저장
                        </button>
                      )}
                      <button
                        onClick={() => toggleExpand(company.corpCode)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        {expandedCode === company.corpCode
                          ? <ChevronUp className="w-4 h-4" />
                          : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {expandedCode === company.corpCode && (
                    <div className="border-t border-gray-100 px-4 pb-4 pt-3">
                      {detailLoading ? (
                        <div className="flex justify-center py-4"><Spinner /></div>
                      ) : detail ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                            {detail.ceoNm && <Row label="대표이사" value={detail.ceoNm} />}
                            {detail.estDt && <Row label="설립일" value={detail.estDt} />}
                            {detail.bizrNo && <Row label="사업자번호" value={detail.bizrNo} />}
                            {detail.phone && <Row label="전화번호" value={detail.phone} />}
                            {detail.indutyCode && <Row label="업종코드" value={detail.indutyCode} />}
                            {detail.corpNameEng && <Row label="영문명" value={detail.corpNameEng} />}
                            {detail.address && (
                              <div className="col-span-2">
                                <Row label="주소" value={detail.address} />
                              </div>
                            )}
                          </div>

                          {detail.website && (
                            <a
                              href={detail.website.startsWith('http') ? detail.website : `https://${detail.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" />{detail.website}
                            </a>
                          )}

                          {!isSaved(company) && (
                            <div className="pt-1">
                              <button
                                onClick={() => saveDetailM.mutate()}
                                disabled={saveDetailM.isPending}
                                className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors border border-blue-100"
                              >
                                <Download className="w-3.5 h-3.5" />내 기업 목록에 저장
                              </button>
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-gray-400">{label}</span>
      <p className="text-sm text-gray-800 mt-0.5">{value}</p>
    </div>
  );
}
