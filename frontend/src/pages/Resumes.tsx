import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Copy, Upload, FileDown, X } from 'lucide-react';
import { resumesApi } from '../api';
import type { ResumeResponse, ResumeRequest, ResumeType } from '../types';
import { Modal, Field, Input, Textarea, Select, Btn, Spinner, Empty, TagBadge, PageHeader } from '../components/ui';

const TYPES: { value: ResumeType; label: string }[] = [{ value: 'RESUME', label: '이력서' }, { value: 'PORTFOLIO', label: '포트폴리오' }];
const DEF: ResumeRequest = { title: '', type: 'RESUME', content: '', targetCompany: '', targetPosition: '', version: 1, isTemplate: false };
const fmt = (d: string) => new Date(d).toLocaleDateString('ko-KR');

export default function Resumes() {
  const qc = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<ResumeType | 'ALL'>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ResumeResponse | null>(null);
  const [form, setForm] = useState<ResumeRequest>(DEF);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<number | null>(null);

  const { data: list = [], isLoading } = useQuery({ queryKey: ['resumes', typeFilter], queryFn: () => resumesApi.list(typeFilter !== 'ALL' ? { type: typeFilter } : undefined) });

  const inv = () => qc.invalidateQueries({ queryKey: ['resumes'] });
  const createM = useMutation({ mutationFn: resumesApi.create, onSuccess: () => { inv(); close(); } });
  const updateM = useMutation({ mutationFn: ({ id, data }: { id: number; data: ResumeRequest }) => resumesApi.update(id, data), onSuccess: () => { inv(); close(); } });
  const deleteM = useMutation({ mutationFn: resumesApi.delete, onSuccess: inv });
  const copyM = useMutation({ mutationFn: resumesApi.copy, onSuccess: inv });
  const uploadM = useMutation({ mutationFn: ({ id, file }: { id: number; file: File }) => resumesApi.uploadFile(id, file), onSuccess: inv });
  const delFileM = useMutation({ mutationFn: resumesApi.deleteFile, onSuccess: inv });

  function open(r?: ResumeResponse) {
    setEditing(r ?? null);
    setForm(r ? { title: r.title, type: r.type, content: r.content ?? '', targetCompany: r.targetCompany ?? '', targetPosition: r.targetPosition ?? '', version: r.version, isTemplate: r.isTemplate } : DEF);
    setShowModal(true);
  }
  function close() { setShowModal(false); setEditing(null); }
  function submit(e: React.FormEvent) { e.preventDefault(); editing ? updateM.mutate({ id: editing.id, data: form }) : createM.mutate(form); }
  function del(r: ResumeResponse) { if (confirm(`"${r.title}"을 삭제하시겠습니까?`)) deleteM.mutate(r.id); }
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (uploadTarget && e.target.files?.[0]) uploadM.mutate({ id: uploadTarget, file: e.target.files[0] });
  }

  const s = (k: keyof ResumeRequest) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <input type="file" ref={fileRef} onChange={handleFile} className="hidden" accept=".pdf,.doc,.docx,.hwp" />
      <PageHeader title="이력서" action={<Btn onClick={() => open()}><Plus className="w-4 h-4" />이력서 추가</Btn>} />

      <div className="flex gap-1.5 mb-5">
        {(['ALL', ...TYPES.map(t => t.value)] as const).map(t => (
          <button key={t} onClick={() => setTypeFilter(t as ResumeType | 'ALL')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${typeFilter === t ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm border border-gray-200'}`}>
            {t === 'ALL' ? '전체' : TYPES.find(tp => tp.value === t)?.label ?? t}
          </button>
        ))}
      </div>

      {isLoading ? <Spinner /> : list.length === 0 ? <Empty message="등록된 이력서가 없습니다" /> : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b"><tr>
              {['제목', '유형', '대상기업/직무', '버전', '파일', '태그', '등록일', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y">
              {list.map(r => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {r.title}
                    {r.isTemplate && <span className="ml-2 text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded">템플릿</span>}
                  </td>
                  <td className="px-4 py-3"><span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{r.typeLabel}</span></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {r.targetCompany && <p>{r.targetCompany}</p>}
                    {r.targetPosition && <p className="text-gray-400">{r.targetPosition}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-center">v{r.version}</td>
                  <td className="px-4 py-3">
                    {r.fileUrl
                      ? <div className="flex items-center gap-1">
                          <a href={r.fileUrl} className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700">
                            <FileDown className="w-3.5 h-3.5" />{r.originalFileName?.split('_').slice(1).join('_') || '파일'}
                          </a>
                          <button onClick={() => delFileM.mutate(r.id)}><X className="w-3 h-3 text-gray-300 hover:text-red-500" /></button>
                        </div>
                      : <button onClick={() => { setUploadTarget(r.id); fileRef.current?.click(); }} className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-500">
                          <Upload className="w-3.5 h-3.5" />업로드
                        </button>
                    }
                  </td>
                  <td className="px-4 py-3"><div className="flex gap-1">{r.tags.map(t => <TagBadge key={t.id} name={t.name} color={t.color} />)}</div></td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{fmt(r.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => copyM.mutate(r.id)} title="버전 복사" className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-violet-600"><Copy className="w-3.5 h-3.5" /></button>
                      <button onClick={() => open(r)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => del(r)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showModal} onClose={close} title={editing ? '이력서 수정' : '이력서 추가'}>
        <form onSubmit={submit} className="space-y-4">
          <Field label="제목" required><Input value={form.title} onChange={s('title')} required placeholder="이력서 제목" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="유형">
              <Select value={form.type} onChange={s('type')}>{TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</Select>
            </Field>
            <Field label="버전"><Input type="number" min={1} value={form.version ?? 1} onChange={s('version')} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="대상 기업"><Input value={form.targetCompany ?? ''} onChange={s('targetCompany')} placeholder="카카오" /></Field>
            <Field label="대상 직무"><Input value={form.targetPosition ?? ''} onChange={s('targetPosition')} placeholder="백엔드 개발자" /></Field>
          </div>
          <Field label="내용"><Textarea rows={5} value={form.content ?? ''} onChange={s('content')} placeholder="이력서 내용을 입력하세요" /></Field>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isTemplate} onChange={e => setForm(f => ({ ...f, isTemplate: e.target.checked }))} className="w-4 h-4 accent-blue-600" />
            <span className="text-sm text-gray-700">템플릿으로 저장</span>
          </label>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Btn type="button" variant="secondary" onClick={close}>취소</Btn>
            <Btn type="submit" disabled={createM.isPending || updateM.isPending}>저장</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
