import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, ExternalLink, MapPin, Briefcase } from 'lucide-react';
import { companiesApi } from '../api';
import type { CompanyResponse, CompanyRequest } from '../types';
import { Modal, Field, Input, Textarea, Btn, Spinner, Empty, TagBadge, PageHeader } from '../components/ui';

const DEF: CompanyRequest = { name:'', industry:'', location:'', website:'', size:'', welfare:'', memo:'' };

export default function Companies() {
  const qc = useQueryClient();
  const [keyword, setKeyword] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CompanyResponse | null>(null);
  const [form, setForm] = useState<CompanyRequest>(DEF);

  const { data: list = [], isLoading } = useQuery({ queryKey: ['companies', keyword], queryFn: () => companiesApi.list(keyword || undefined) });

  const inv = () => qc.invalidateQueries({ queryKey: ['companies'] });
  const createM = useMutation({ mutationFn: companiesApi.create, onSuccess: () => { inv(); close(); } });
  const updateM = useMutation({ mutationFn: ({ id, data }: { id: number; data: CompanyRequest }) => companiesApi.update(id, data), onSuccess: () => { inv(); close(); } });
  const deleteM = useMutation({ mutationFn: companiesApi.delete, onSuccess: inv });

  function open(c?: CompanyResponse) {
    setEditing(c ?? null);
    setForm(c ? { name: c.name, industry: c.industry ?? '', location: c.location ?? '', website: c.website ?? '', size: c.size ?? '', welfare: c.welfare ?? '', memo: c.memo ?? '' } : DEF);
    setShowModal(true);
  }
  function close() { setShowModal(false); setEditing(null); }
  function submit(e: React.FormEvent) { e.preventDefault(); editing ? updateM.mutate({ id: editing.id, data: form }) : createM.mutate(form); }
  function del(c: CompanyResponse) { if (confirm(`"${c.name}" 기업을 삭제하시겠습니까?`)) deleteM.mutate(c.id); }
  const s = (k: keyof CompanyRequest) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <PageHeader title="기업" action={<Btn onClick={() => open()}><Plus className="w-4 h-4" />기업 추가</Btn>} />

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
