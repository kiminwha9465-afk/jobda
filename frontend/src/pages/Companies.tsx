import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, ExternalLink, MapPin, Briefcase, Search, Download, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { companiesApi, dartApi } from '../api';
import type { CompanyResponse, CompanyRequest, DartCompany } from '../types';
import { Modal, Field, Input, Textarea, Btn, Spinner, Empty, TagBadge, PageHeader } from '../components/ui';

const DEF: CompanyRequest = { name:'', industry:'', location:'', website:'', size:'', welfare:'', memo:'' };

const CLS_BADGE: Record<string, string> = {
  '코스피': 'bg-blue-50 text-blue-600',
  '코스닥': 'bg-violet-50 text-violet-600',
  '코넥스': 'bg-orange-50 text-orange-600',
  '비상장': 'bg-gray-100 text-gray-500',
};

export default function Companies() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'list' | 'dart'>('list');

  // 내 기업 탭 state
  const [keyword, setKeyword] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CompanyResponse | null>(null);
  const [form, setForm] = useState<CompanyRequest>(DEF);

  // DART 탭 state
  const [dartInput, setDartInput] = useState('');
  const [dartQuery, setDartQuery] = useState('');
  const [expandedCode, setExpandedCode] = useState<string | null>(null);
  const [savedCodes, setSavedCodes] = useState<Set<string>>(new Set());

  const inv = () => qc.invalidateQueries({ queryKey: ['companies'] });

  // 내 기업 쿼리
  const { data: list = [], isLoading } = useQuery({
    queryKey: ['companies', keyword],
    queryFn: () => companiesApi.list(keyword || undefined),
  });

  // DART 검색 쿼리
  const { data: dartResults = [], isLoading: dartLoading, error: dartError } = useQuery({
    queryKey: ['dart-search', dartQuery],
    queryFn: () => dartApi.search(dartQuery),
    enabled: dartQuery.trim().length > 0,
    retry: false,
  });

  const { data: dartDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['dart-detail', expandedCode],
    queryFn: () => dartApi.detail(expandedCode!),
    enabled: !!expandedCode,
    retry: false,
  });

  // 내 기업 mutations
  const createM = useMutation({ mutationFn: companiesApi.create, onSuccess: () => { inv(); close(); } });
  const updateM = useMutation({ mutationFn: ({ id, data }: { id: number; data: CompanyRequest }) => companiesApi.update(id, data), onSuccess: () => { inv(); close(); } });
  const deleteM = useMutation({ mutationFn: companiesApi.delete, onSuccess: inv });

  // DART 저장 mutation
  const dartSaveM = useMutation({
    mutationFn: (c: DartCompany) => dartApi.save({ corpName: c.corpName, indutyCode: c.indutyCode, address: c.address, website: c.website, corpCls: c.corpCls }),
    onSuccess: (_, c) => { setSavedCodes(s => new Set(s).add(c.corpCode)); inv(); },
  });
  const dartDetailSaveM = useMutation({
    mutationFn: () => dartApi.save({ corpName: dartDetail!.corpName, indutyCode: dartDetail!.indutyCode, address: dartDetail!.address, website: dartDetail!.website, corpCls: dartDetail!.corpCls }),
    onSuccess: () => { setSavedCodes(s => new Set(s).add(expandedCode!)); inv(); },
  });

  function open(c?: CompanyResponse) {
    setEditing(c ?? null);
    setForm(c ? { name: c.name, industry: c.industry ?? '', location: c.location ?? '', website: c.website ?? '', size: c.size ?? '', welfare: c.welfare ?? '', memo: c.memo ?? '' } : DEF);
    setShowModal(true);
  }
  function close() { setShowModal(false); setEditing(null); }
  function submit(e: React.FormEvent) { e.preventDefault(); editing ? updateM.mutate({ id: editing.id, data: form }) : createM.mutate(form); }
  function del(c: CompanyResponse) { if (confirm(`"${c.name}" 기업을 삭제하시겠습니까?`)) deleteM.mutate(c.id); }
  const s = (k: keyof CompanyRequest) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  function handleDartSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!dartInput.trim()) return;
    setSavedCodes(new Set());
    setExpandedCode(null);
    setDartQuery(dartInput.trim());
  }

  const isDartSaved = (c: DartCompany) => c.alreadySaved || savedCodes.has(c.corpCode);

  return (
    <div>
      <PageHeader
        title="기업"
        action={tab === 'list' ? <Btn onClick={() => open()}><Plus className="w-4 h-4" />기업 추가</Btn> : undefined}
      />

      {/* 탭 */}
      <div className="flex gap-1 mb-5 border-b border-gray-200">
        {(['list', 'dart'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'list' ? '내 기업 목록' : 'DART 검색'}
          </button>
        ))}
      </div>

      {/* 내 기업 목록 */}
      {tab === 'list' && (
        <>
          <div className="mb-5">
            <Input placeholder="기업명, 업종, 복지, 메모로 검색..." value={keyword} onChange={e => setKeyword(e.target.value)} />
          </div>

          {isLoading ? <Spinner /> : list.length === 0 ? <Empty message="등록된 기업이 없습니다" /> : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {list.map(c => (
                <div key={c.id} className="bg-white rounded-xl shadow-sm p-5 flex flex-col">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{c.name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{[c.industry, c.size].filter(Boolean).join(' · ')}</p>
                    </div>
                    <div className="flex gap-1 shrink-0 ml-2">
                      <button onClick={() => open(c)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => del(c)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>

                  <div className="space-y-1.5 mb-3">
                    {c.location && <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3 shrink-0" />{c.location}</p>}
                    {c.website && (
                      <a href={c.website} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1 truncate">
                        <ExternalLink className="w-3 h-3 shrink-0" />{c.website}
                      </a>
                    )}
                  </div>

                  {c.welfare && (
                    <div className="mb-3 p-2.5 bg-emerald-50 rounded-lg">
                      <p className="text-xs font-semibold text-emerald-700 mb-1">복지</p>
                      <p className="text-xs text-emerald-600 line-clamp-2">{c.welfare}</p>
                    </div>
                  )}

                  {c.memo && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{c.memo}</p>}

                  {c.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">{c.tags.map(t => <TagBadge key={t.id} name={t.name} color={t.color} />)}</div>
                  )}

                  <div className="mt-auto pt-3 border-t flex items-center gap-1 text-xs text-gray-400">
                    <Briefcase className="w-3 h-3" />{c.jobPostingCount}개 공고
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* DART 검색 탭 */}
      {tab === 'dart' && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <form onSubmit={handleDartSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={dartInput}
                  onChange={e => setDartInput(e.target.value)}
                  placeholder="기업명으로 검색  (예: 삼성전자, 카카오, 네이버)"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <Btn type="submit"><Search className="w-4 h-4" />검색</Btn>
            </form>
            <p className="text-xs text-gray-400 mt-2">금융감독원 DART 데이터 기반 · 검색 후 저장하면 내 기업 목록에 추가됩니다.</p>
          </div>

          {dartQuery && (
            dartLoading ? <Spinner /> : dartError ? (
              <div className="bg-red-50 text-red-600 rounded-xl p-5 text-sm text-center">검색 실패: DART API 키를 확인해주세요.</div>
            ) : dartResults.length === 0 ? <Empty message="검색 결과가 없습니다" /> : (
              <div className="space-y-2">
                {dartResults.map(company => (
                  <div key={company.corpCode} className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 p-4">
                      <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 text-sm">{company.corpName}</span>
                        {company.corpCls && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CLS_BADGE[company.corpCls] ?? 'bg-gray-100 text-gray-500'}`}>
                            {company.corpCls}
                          </span>
                        )}
                        {company.stockCode && <span className="text-xs text-gray-400">{company.stockCode}</span>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isDartSaved(company) ? (
                          <span className="flex items-center gap-1 text-xs text-emerald-500 font-medium"><CheckCircle2 className="w-4 h-4" />저장됨</span>
                        ) : (
                          <button
                            onClick={() => dartSaveM.mutate(company)}
                            disabled={dartSaveM.isPending}
                            className="flex items-center gap-1 text-xs text-blue-600 font-medium px-2.5 py-1 rounded-lg hover:bg-blue-50 border border-blue-100 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />저장
                          </button>
                        )}
                        <button
                          onClick={() => setExpandedCode(p => p === company.corpCode ? null : company.corpCode)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          {expandedCode === company.corpCode ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {expandedCode === company.corpCode && (
                      <div className="border-t border-gray-100 px-4 pb-4 pt-3">
                        {detailLoading ? <div className="flex justify-center py-4"><Spinner /></div> : dartDetail ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                              {dartDetail.ceoNm && <DetailRow label="대표이사" value={dartDetail.ceoNm} />}
                              {dartDetail.estDt && <DetailRow label="설립일" value={dartDetail.estDt} />}
                              {dartDetail.bizrNo && <DetailRow label="사업자번호" value={dartDetail.bizrNo} />}
                              {dartDetail.phone && <DetailRow label="전화번호" value={dartDetail.phone} />}
                              {dartDetail.indutyCode && <DetailRow label="업종코드" value={dartDetail.indutyCode} />}
                              {dartDetail.corpNameEng && <DetailRow label="영문명" value={dartDetail.corpNameEng} />}
                              {dartDetail.address && <div className="col-span-2"><DetailRow label="주소" value={dartDetail.address} /></div>}
                            </div>
                            {dartDetail.website && (
                              <a href={dartDetail.website.startsWith('http') ? dartDetail.website : `https://${dartDetail.website}`}
                                target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline">
                                <ExternalLink className="w-3 h-3" />{dartDetail.website}
                              </a>
                            )}
                            {!isDartSaved(company) && (
                              <button
                                onClick={() => dartDetailSaveM.mutate()}
                                disabled={dartDetailSaveM.isPending}
                                className="flex items-center gap-1.5 text-sm text-blue-600 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 border border-blue-100 transition-colors"
                              >
                                <Download className="w-3.5 h-3.5" />내 기업 목록에 저장
                              </button>
                            )}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}

      <Modal isOpen={showModal} onClose={close} title={editing ? '기업 수정' : '기업 추가'}>
        <form onSubmit={submit} className="space-y-4">
          <Field label="기업명" required><Input value={form.name} onChange={s('name')} required placeholder="기업명을 입력하세요" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="업종"><Input value={form.industry ?? ''} onChange={s('industry')} placeholder="IT, 금융 등" /></Field>
            <Field label="규모"><Input value={form.size ?? ''} onChange={s('size')} placeholder="대기업, 스타트업 등" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="위치"><Input value={form.location ?? ''} onChange={s('location')} placeholder="서울시 강남구" /></Field>
            <Field label="웹사이트"><Input value={form.website ?? ''} onChange={s('website')} placeholder="https://" /></Field>
          </div>
          <Field label="복지"><Textarea value={form.welfare ?? ''} onChange={s('welfare')} placeholder="복지 정보를 입력하세요 (식대, 자율출퇴근 등)" /></Field>
          <Field label="메모"><Textarea value={form.memo ?? ''} onChange={s('memo')} placeholder="기업에 대한 메모를 입력하세요" /></Field>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Btn type="button" variant="secondary" onClick={close}>취소</Btn>
            <Btn type="submit" disabled={createM.isPending || updateM.isPending}>저장</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-gray-400">{label}</span>
      <p className="text-sm text-gray-800 mt-0.5">{value}</p>
    </div>
  );
}
