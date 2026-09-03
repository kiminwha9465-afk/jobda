import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Copy, ChevronDown, ChevronUp, PlusCircle, X, PenLine, ClipboardPaste, CheckCircle, ExternalLink } from 'lucide-react';
import { coverLettersApi, companiesApi } from '../api';
import type { CoverLetterResponse, CoverLetterRequest, CoverLetterItemRequest } from '../types';
import { Modal, Field, Input, Textarea, Select, Btn, Spinner, Empty, TagBadge, PageHeader } from '../components/ui';

const DEF: CoverLetterRequest = { title: '', companyId: null, targetPosition: '', version: 1, items: [] };
const DEF_ITEM: CoverLetterItemRequest = { question: '', answer: '', charLimit: undefined, orderIndex: 0 };

const fmtDate = (d: string) => new Date(d).toLocaleDateString('ko-KR');

export default function CoverLetters() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [showWriting, setShowWriting] = useState(false);
  const [editing, setEditing] = useState<CoverLetterResponse | null>(null);

  // 글쓰기 도구 state
  const [wtText, setWtText] = useState('');
  const [wtLimit, setWtLimit] = useState<number | ''>('');
  const [wtCopied, setWtCopied] = useState(false);
  const wtCount = wtText.length;
  const wtLimitNum = typeof wtLimit === 'number' ? wtLimit : null;
  const wtOver = wtLimitNum !== null && wtCount > wtLimitNum;
  const wtNear = wtLimitNum !== null && wtCount > wtLimitNum * 0.9;
  function openSpellChecker() {
    const form = document.createElement('form');
    form.method = 'POST'; form.action = 'https://dic.daum.net/grammar_checker.do'; form.target = '_blank';
    const input = document.createElement('input');
    input.type = 'hidden'; input.name = 'sentence'; input.value = wtText;
    form.appendChild(input); document.body.appendChild(form); form.submit(); document.body.removeChild(form);
  }
  function handleWtCopy() {
    navigator.clipboard.writeText(wtText).then(() => { setWtCopied(true); setTimeout(() => setWtCopied(false), 2000); });
  }
  const [form, setForm] = useState<CoverLetterRequest>(DEF);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const { data: list = [], isLoading } = useQuery({ queryKey: ['cover-letters'], queryFn: () => coverLettersApi.list() });
  const { data: companies = [] } = useQuery({ queryKey: ['companies'], queryFn: () => companiesApi.list() });

  const inv = () => qc.invalidateQueries({ queryKey: ['cover-letters'] });
  const createM = useMutation({ mutationFn: coverLettersApi.create, onSuccess: () => { inv(); close(); } });
  const updateM = useMutation({ mutationFn: ({ id, data }: { id: number; data: CoverLetterRequest }) => coverLettersApi.update(id, data), onSuccess: () => { inv(); close(); } });
  const deleteM = useMutation({ mutationFn: coverLettersApi.delete, onSuccess: inv });
  const copyM = useMutation({ mutationFn: coverLettersApi.copy, onSuccess: inv });

  function open(cl?: CoverLetterResponse) {
    setEditing(cl ?? null);
    setForm(cl ? {
      title: cl.title, companyId: cl.companyId, targetPosition: cl.targetPosition ?? '',
      version: cl.version,
      items: cl.items.map(i => ({ question: i.question, answer: i.answer ?? '', charLimit: i.charLimit ?? undefined, orderIndex: i.orderIndex })),
    } : DEF);
    setShowModal(true);
  }
  function close() { setShowModal(false); setEditing(null); }
  function submit(e: React.FormEvent) { e.preventDefault(); editing ? updateM.mutate({ id: editing.id, data: form }) : createM.mutate(form); }
  function del(cl: CoverLetterResponse) { if (confirm(`"${cl.title}"을 삭제하시겠습니까?`)) deleteM.mutate(cl.id); }
  function toggle(id: number) { setExpanded(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; }); }

  function addItem() { setForm(f => ({ ...f, items: [...(f.items ?? []), { ...DEF_ITEM, orderIndex: (f.items ?? []).length }] })); }
  function removeItem(i: number) { setForm(f => ({ ...f, items: (f.items ?? []).filter((_, idx) => idx !== i) })); }
  function setItem(i: number, k: keyof CoverLetterItemRequest, v: string | number) {
    setForm(f => ({ ...f, items: (f.items ?? []).map((item, idx) => idx === i ? { ...item, [k]: v } : item) }));
  }

  return (
    <div>
      <PageHeader title="자소서" action={
        <div className="flex gap-2">
          <Btn variant="secondary" onClick={() => setShowWriting(true)}><PenLine className="w-4 h-4" />글쓰기 도구</Btn>
          <Btn onClick={() => open()}><Plus className="w-4 h-4" />자소서 추가</Btn>
        </div>
      } />

      {isLoading ? <Spinner /> : list.length === 0 ? <Empty message="등록된 자소서가 없습니다" /> : (
        <div className="space-y-3">
          {list.map(cl => (
            <div key={cl.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50" onClick={() => toggle(cl.id)}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {expanded.has(cl.id) ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 truncate">{cl.title}</p>
                      <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-medium shrink-0">v{cl.version}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {cl.companyName && <span>{cl.companyName}</span>}
                      {cl.targetPosition && <span> · {cl.targetPosition}</span>}
                      <span className="ml-2">문항 {cl.items.length}개</span>
                      <span className="ml-2">{fmtDate(cl.createdAt)}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-3 shrink-0" onClick={e => e.stopPropagation()}>
                  <div className="flex gap-1">{cl.tags.map(t => <TagBadge key={t.id} name={t.name} color={t.color} />)}</div>
                  <button onClick={() => copyM.mutate(cl.id)} title="버전 복사" className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-violet-600"><Copy className="w-3.5 h-3.5" /></button>
                  <button onClick={() => open(cl)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => del(cl)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>

              {expanded.has(cl.id) && (
                <div className="border-t divide-y">
                  {cl.items.length === 0
                    ? <p className="px-5 py-4 text-sm text-gray-400">등록된 문항이 없습니다</p>
                    : cl.items.map((item, i) => (
                      <div key={i} className="px-5 py-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-sm font-medium text-gray-800">Q{i + 1}. {item.question}</p>
                          {item.charLimit && (
                            <span className={`text-xs shrink-0 ${item.currentLength > item.charLimit ? 'text-red-500' : 'text-gray-400'}`}>
                              {item.currentLength} / {item.charLimit}자
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-lg p-3 min-h-[60px]">
                          {item.answer ?? <span className="text-gray-300 italic">아직 작성하지 않은 문항입니다</span>}
                        </p>
                      </div>
                    ))
                  }
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={close} title={editing ? '자소서 수정' : '자소서 추가'}>
        <form onSubmit={submit} className="space-y-4">
          <Field label="제목" required><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="자소서 제목" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="기업">
              <Select value={form.companyId ?? ''} onChange={e => setForm(f => ({ ...f, companyId: e.target.value ? Number(e.target.value) : null }))}>
                <option value="">기업 선택</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            <Field label="지원 직무"><Input value={form.targetPosition ?? ''} onChange={e => setForm(f => ({ ...f, targetPosition: e.target.value }))} placeholder="백엔드 개발자" /></Field>
          </div>
          <Field label="버전"><Input type="number" min={1} value={form.version ?? 1} onChange={e => setForm(f => ({ ...f, version: Number(e.target.value) }))} /></Field>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-700">자소서 문항</p>
              <button type="button" onClick={addItem} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700">
                <PlusCircle className="w-3.5 h-3.5" />문항 추가
              </button>
            </div>
            <div className="space-y-4">
              {(form.items ?? []).map((item, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-gray-600">문항 {i + 1}</p>
                    <button type="button" onClick={() => removeItem(i)}><X className="w-4 h-4 text-gray-400 hover:text-red-500" /></button>
                  </div>
                  <Input value={item.question} onChange={e => setItem(i, 'question', e.target.value)} placeholder="질문을 입력하세요" required />
                  <Textarea rows={3} value={item.answer ?? ''} onChange={e => setItem(i, 'answer', e.target.value)} placeholder="답변을 입력하세요" />
                  <Input type="number" value={item.charLimit ?? ''} onChange={e => setItem(i, 'charLimit', Number(e.target.value))} placeholder="글자 수 제한 (선택)" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Btn type="button" variant="secondary" onClick={close}>취소</Btn>
            <Btn type="submit" disabled={createM.isPending || updateM.isPending}>저장</Btn>
          </div>
        </form>
      </Modal>
      {/* 글쓰기 도구 모달 */}
      <Modal isOpen={showWriting} onClose={() => setShowWriting(false)} title="글쓰기 도구" size="xl">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">텍스트 입력</p>
            <div className="flex items-center gap-2">
              <button onClick={() => navigator.clipboard.readText().then(t => setWtText(p => p + t))} title="클립보드에서 붙여넣기"
                className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                <ClipboardPaste className="w-4 h-4" />
              </button>
              <button onClick={() => setWtText('')} title="초기화"
                className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <textarea
            value={wtText}
            onChange={e => setWtText(e.target.value)}
            placeholder="텍스트를 입력하세요..."
            className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
            rows={14}
          />

          <div className="flex items-center gap-3">
            <span className={`text-sm font-semibold ${wtOver ? 'text-red-500' : wtNear ? 'text-orange-500' : 'text-gray-700'}`}>
              {wtCount.toLocaleString()}자
            </span>
            {wtLimitNum !== null && (
              <>
                <span className="text-sm text-gray-400">/ {wtLimitNum.toLocaleString()}자</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${wtOver ? 'bg-red-500' : wtNear ? 'bg-orange-400' : 'bg-blue-500'}`}
                    style={{ width: `${Math.min((wtCount / wtLimitNum) * 100, 100)}%` }} />
                </div>
                {wtOver && <span className="text-xs text-red-500 shrink-0">{wtCount - wtLimitNum}자 초과</span>}
              </>
            )}
          </div>

          <div className="flex items-center gap-2 border-t pt-3">
            <label className="text-xs text-gray-500 shrink-0">글자 수 제한</label>
            <input type="number" min={0} value={wtLimit}
              onChange={e => setWtLimit(e.target.value ? Number(e.target.value) : '')}
              placeholder="예: 500"
              className="w-28 px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {wtLimit !== '' && <button onClick={() => setWtLimit('')} className="text-xs text-gray-400 hover:text-gray-600">초기화</button>}
          </div>

          <div className="flex gap-2 border-t pt-3">
            <Btn onClick={handleWtCopy} variant="secondary" disabled={!wtText.trim()}>
              {wtCopied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <ClipboardPaste className="w-4 h-4" />}
              {wtCopied ? '복사됨' : '텍스트 복사'}
            </Btn>
            <Btn onClick={openSpellChecker} disabled={!wtText.trim()}>
              <ExternalLink className="w-4 h-4" />맞춤법 검사 (Daum)
            </Btn>
          </div>
          <p className="text-xs text-gray-400">맞춤법 검사 버튼을 누르면 Daum 맞춤법 검사기 새 탭에서 결과를 확인할 수 있습니다.</p>
        </div>
      </Modal>
    </div>
  );
}
