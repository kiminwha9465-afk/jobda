import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Copy, Upload, FileDown, X, PlusCircle, Link2 } from 'lucide-react';
import { resumesApi } from '../api';
import type { ResumeResponse, ResumeRequest, ResumeType } from '../types';
import { Modal, Field, Input, Select, Textarea, Btn, Spinner, Empty, TagBadge, PageHeader } from '../components/ui';

// ── Resume Section Types ───────────────────────────────────────────────────────
interface EduItem { school: string; major: string; degree: string; startDate: string; endDate: string; current: boolean; gpa: string; }
interface CareerItem { company: string; department: string; position: string; startDate: string; endDate: string; current: boolean; description: string; }
interface CertItem { name: string; issuer: string; date: string; score: string; }
interface AwardItem { name: string; organization: string; date: string; description: string; }
interface LangItem { language: string; test: string; score: string; date: string; }
interface SkillItem { category: string; items: string; }
interface ActivityItem { name: string; organization: string; role: string; startDate: string; endDate: string; current: boolean; description: string; }

interface ResumeContent {
  education: EduItem[]; career: CareerItem[]; certifications: CertItem[];
  awards: AwardItem[]; languages: LangItem[]; skills: SkillItem[]; activities: ActivityItem[];
}
type DraftMap = { education: EduItem; career: CareerItem; certifications: CertItem; awards: AwardItem; languages: LangItem; skills: SkillItem; activities: ActivityItem; };

// ── Portfolio Types ────────────────────────────────────────────────────────────
interface PortfolioLink { label: string; url: string; }
interface PortfolioContent { description: string; links: PortfolioLink[]; }

// ── Defaults ───────────────────────────────────────────────────────────────────
const EMPTY: ResumeContent = { education: [], career: [], certifications: [], awards: [], languages: [], skills: [], activities: [] };
const DEFAULTS: DraftMap = {
  education:      { school: '', major: '', degree: '학사', startDate: '', endDate: '', current: false, gpa: '' },
  career:         { company: '', department: '', position: '', startDate: '', endDate: '', current: false, description: '' },
  certifications: { name: '', issuer: '', date: '', score: '' },
  awards:         { name: '', organization: '', date: '', description: '' },
  languages:      { language: '', test: '', score: '', date: '' },
  skills:         { category: '', items: '' },
  activities:     { name: '', organization: '', role: '', startDate: '', endDate: '', current: false, description: '' },
};
const DEF_PORTFOLIO: PortfolioContent = { description: '', links: [] };
const RESUME_TYPES: { value: ResumeType; label: string }[] = [{ value: 'RESUME', label: '이력서' }, { value: 'PORTFOLIO', label: '포트폴리오' }];
const DEF_FORM: ResumeRequest = { title: '', type: 'RESUME', content: '', targetCompany: '', targetPosition: '', version: 1, isTemplate: false };

// ── Helpers ────────────────────────────────────────────────────────────────────
function parseContent(raw?: string | null): ResumeContent {
  try { return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY; } catch { return EMPTY; }
}
function parsePortfolioContent(raw?: string | null): PortfolioContent {
  try {
    const parsed = raw ? JSON.parse(raw) : {};
    if (Array.isArray(parsed.links)) return { description: parsed.description ?? '', links: parsed.links };
    return DEF_PORTFOLIO;
  } catch { return DEF_PORTFOLIO; }
}
const mon = (d: string) => d ? d.slice(0, 7).replace('-', '.') : '';
const fmt = (d: string) => new Date(d).toLocaleDateString('ko-KR');
const eduSum   = (e: EduItem)     => `${e.school}${e.major ? ' ' + e.major : ''}${e.degree ? ' ' + e.degree : ''}${e.startDate ? ` (${mon(e.startDate)}~${e.current ? '재학중' : mon(e.endDate)})` : ''}`;
const carSum   = (e: CareerItem)  => `${e.company}${e.position ? ' · ' + e.position : ''}${e.startDate ? ` (${mon(e.startDate)}~${e.current ? '현재' : mon(e.endDate)})` : ''}`;
const certSum  = (e: CertItem)    => [e.name, e.issuer, e.date].filter(Boolean).join(' · ');
const awarSum  = (e: AwardItem)   => [e.name, e.organization, e.date].filter(Boolean).join(' · ');
const langSum  = (e: LangItem)    => [e.language, e.test, e.score].filter(Boolean).join(' ');
const skillSum = (e: SkillItem)   => e.category ? `${e.category}: ${e.items}` : e.items;
const actSum   = (e: ActivityItem)=> [e.name, e.organization].filter(Boolean).join(' · ');

function contentBadge(c: ResumeContent) {
  return [c.education.length && `학력 ${c.education.length}`, c.career.length && `경력 ${c.career.length}`,
    c.certifications.length && `자격증 ${c.certifications.length}`, c.awards.length && `수상 ${c.awards.length}`,
    c.languages.length && `어학 ${c.languages.length}`, c.skills.length && `기술 ${c.skills.length}`,
    c.activities.length && `활동 ${c.activities.length}`].filter(Boolean).join(' · ');
}

// ── UI Atoms ───────────────────────────────────────────────────────────────────
const ic = 'w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500';

function G2({ children }: { children: React.ReactNode }) { return <div className="grid grid-cols-2 gap-2">{children}</div>; }

function FI({ label, full, ...p }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; full?: boolean }) {
  return <div className={`space-y-0.5${full ? ' col-span-2' : ''}`}><label className="text-xs text-gray-500">{label}</label><input {...p} className={ic} /></div>;
}
function FS({ label, children, ...p }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: React.ReactNode }) {
  return <div className="space-y-0.5"><label className="text-xs text-gray-500">{label}</label><select {...p} className={`${ic} bg-white`}>{children}</select></div>;
}
function FT({ label, ...p }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return <div className="col-span-2 space-y-0.5"><label className="text-xs text-gray-500">{label}</label><textarea {...p} rows={p.rows ?? 2} className={`${ic} resize-none`} /></div>;
}
function FC({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer self-end pb-2"><input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="accent-blue-600 w-3.5 h-3.5" />{label}</label>;
}

function SectionCard({ title, count, onAdd, children }: { title: string; count: number; onAdd: () => void; children: React.ReactNode }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b">
        <span className="text-sm font-semibold text-gray-700">{title} <span className="text-xs font-normal text-gray-400">({count})</span></span>
        <button type="button" onClick={onAdd} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"><PlusCircle className="w-3.5 h-3.5" />추가</button>
      </div>
      <div>{children}</div>
    </div>
  );
}
function ItemRow({ summary, onEdit, onDelete }: { summary: string; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b last:border-b-0 hover:bg-gray-50 gap-2">
      <span className="text-sm text-gray-700 truncate">{summary || '(미입력)'}</span>
      <div className="flex gap-0.5 shrink-0">
        <button type="button" onClick={onEdit} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={onDelete} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
}
function FormPanel({ onSave, onCancel, children }: { onSave: () => void; onCancel: () => void; children: React.ReactNode }) {
  return (
    <div className="px-4 py-3 bg-blue-50/40 border-b border-blue-100 space-y-2.5">
      {children}
      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 text-xs rounded border border-gray-200 bg-white hover:bg-gray-50 text-gray-600">취소</button>
        <button type="button" onClick={onSave} className="px-3 py-1.5 text-xs rounded bg-blue-600 text-white hover:bg-blue-700">저장</button>
      </div>
    </div>
  );
}

// ── Section Forms ──────────────────────────────────────────────────────────────
function EduForm({ d, set }: { d: EduItem; set: (v: EduItem) => void }) {
  const f = (k: keyof EduItem) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => set({ ...d, [k]: e.target.value });
  return <G2>
    <FI label="학교명" value={d.school} onChange={f('school')} placeholder="한국대학교" />
    <FI label="전공" value={d.major} onChange={f('major')} placeholder="컴퓨터공학과" />
    <FS label="학위" value={d.degree} onChange={f('degree')}>{['고졸','전문학사','학사','석사','박사'].map(v=><option key={v}>{v}</option>)}</FS>
    <FS label="상태" value={d.current?'재학중':'졸업'} onChange={e=>set({...d,current:e.target.value==='재학중',endDate:e.target.value==='재학중'?'':d.endDate})}>{['졸업','재학중','수료','중퇴','휴학'].map(v=><option key={v}>{v}</option>)}</FS>
    <FI label="입학년월" type="month" value={d.startDate} onChange={f('startDate')} />
    {!d.current && <FI label="졸업년월" type="month" value={d.endDate} onChange={f('endDate')} />}
    <FI label="학점 (선택)" value={d.gpa} onChange={f('gpa')} placeholder="3.8 / 4.5" />
  </G2>;
}
function CareerForm({ d, set }: { d: CareerItem; set: (v: CareerItem) => void }) {
  const f = (k: keyof CareerItem) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set({ ...d, [k]: e.target.value });
  return <G2>
    <FI label="회사명" value={d.company} onChange={f('company')} placeholder="(주)카카오" />
    <FI label="부서 (선택)" value={d.department} onChange={f('department')} placeholder="서버개발팀" />
    <FI label="직무/직책" value={d.position} onChange={f('position')} placeholder="백엔드 개발자" />
    <FC label="재직중" checked={d.current} onChange={v=>set({...d,current:v,endDate:v?'':d.endDate})} />
    <FI label="입사년월" type="month" value={d.startDate} onChange={f('startDate')} />
    {!d.current && <FI label="퇴사년월" type="month" value={d.endDate} onChange={f('endDate')} />}
    <FT label="주요업무 (선택)" value={d.description} onChange={f('description')} placeholder="담당 업무를 입력하세요" />
  </G2>;
}
function CertForm({ d, set }: { d: CertItem; set: (v: CertItem) => void }) {
  const f = (k: keyof CertItem) => (e: React.ChangeEvent<HTMLInputElement>) => set({ ...d, [k]: e.target.value });
  return <G2>
    <FI label="자격증명" value={d.name} onChange={f('name')} placeholder="정보처리기사" />
    <FI label="발급기관" value={d.issuer} onChange={f('issuer')} placeholder="한국산업인력공단" />
    <FI label="취득일" type="month" value={d.date} onChange={f('date')} />
    <FI label="점수/등급 (선택)" value={d.score} onChange={f('score')} placeholder="1급" />
  </G2>;
}
function AwardForm({ d, set }: { d: AwardItem; set: (v: AwardItem) => void }) {
  const f = (k: keyof AwardItem) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set({ ...d, [k]: e.target.value });
  return <G2>
    <FI label="수상명" value={d.name} onChange={f('name')} placeholder="최우수상" />
    <FI label="수여기관" value={d.organization} onChange={f('organization')} placeholder="한국대학교" />
    <FI label="수상일" type="month" value={d.date} onChange={f('date')} />
    <FT label="내용 (선택)" value={d.description} onChange={f('description')} placeholder="수상 내용을 입력하세요" rows={2} />
  </G2>;
}
function LangForm({ d, set }: { d: LangItem; set: (v: LangItem) => void }) {
  const f = (k: keyof LangItem) => (e: React.ChangeEvent<HTMLInputElement>) => set({ ...d, [k]: e.target.value });
  return <G2>
    <FI label="언어" value={d.language} onChange={f('language')} placeholder="영어" />
    <FI label="시험명" value={d.test} onChange={f('test')} placeholder="TOEIC" />
    <FI label="점수/등급" value={d.score} onChange={f('score')} placeholder="900" />
    <FI label="취득일" type="month" value={d.date} onChange={f('date')} />
  </G2>;
}
function SkillForm({ d, set }: { d: SkillItem; set: (v: SkillItem) => void }) {
  const f = (k: keyof SkillItem) => (e: React.ChangeEvent<HTMLInputElement>) => set({ ...d, [k]: e.target.value });
  return <G2>
    <FI label="분류" value={d.category} onChange={f('category')} placeholder="프로그래밍 언어" />
    <FI label="기술 목록 (쉼표 구분)" value={d.items} onChange={f('items')} placeholder="Java, Python, TypeScript" />
  </G2>;
}
function ActivityForm({ d, set }: { d: ActivityItem; set: (v: ActivityItem) => void }) {
  const f = (k: keyof ActivityItem) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set({ ...d, [k]: e.target.value });
  return <G2>
    <FI label="활동명" value={d.name} onChange={f('name')} placeholder="SW마에스트로 13기" />
    <FI label="기관/단체" value={d.organization} onChange={f('organization')} placeholder="과학기술정보통신부" />
    <FI label="역할 (선택)" value={d.role} onChange={f('role')} placeholder="팀장" />
    <FC label="진행중" checked={d.current} onChange={v=>set({...d,current:v,endDate:v?'':d.endDate})} />
    <FI label="시작년월" type="month" value={d.startDate} onChange={f('startDate')} />
    {!d.current && <FI label="종료년월" type="month" value={d.endDate} onChange={f('endDate')} />}
    <FT label="내용 (선택)" value={d.description} onChange={f('description')} placeholder="활동 내용을 입력하세요" />
  </G2>;
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function Resumes() {
  const qc = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<ResumeType | 'ALL'>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ResumeResponse | null>(null);
  const [form, setForm] = useState<ResumeRequest>(DEF_FORM);
  const [content, setContent] = useState<ResumeContent>(EMPTY);
  const [portfolioContent, setPortfolioContent] = useState<PortfolioContent>(DEF_PORTFOLIO);
  const [editSection, setEditSection] = useState<keyof ResumeContent | null>(null);
  const [editIndex, setEditIndex] = useState<number | 'new' | null>(null);
  const [drafts, setDrafts] = useState<DraftMap>({ ...DEFAULTS });
  const fileRef = useRef<HTMLInputElement>(null);
  const modalFileRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<number | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const { data: list = [], isLoading } = useQuery({ queryKey: ['resumes', typeFilter], queryFn: () => resumesApi.list(typeFilter !== 'ALL' ? { type: typeFilter } : undefined) });
  const inv = () => qc.invalidateQueries({ queryKey: ['resumes'] });
  const createM = useMutation({
    mutationFn: resumesApi.create,
    onSuccess: async (data) => {
      if (pendingFile) await resumesApi.uploadFile(data.id, pendingFile);
      inv(); closeModal();
    },
  });
  const updateM = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ResumeRequest }) => resumesApi.update(id, data),
    onSuccess: async (data) => {
      if (pendingFile) await resumesApi.uploadFile(data.id, pendingFile);
      inv(); closeModal();
    },
  });
  const deleteM = useMutation({ mutationFn: resumesApi.delete, onSuccess: inv });
  const copyM   = useMutation({ mutationFn: resumesApi.copy, onSuccess: inv });
  const uploadM = useMutation({ mutationFn: ({ id, file }: { id: number; file: File }) => resumesApi.uploadFile(id, file), onSuccess: inv });
  const delFileM = useMutation({ mutationFn: resumesApi.deleteFile, onSuccess: inv });

  function openModal(r?: ResumeResponse) {
    setEditing(r ?? null);
    const defaultType = !r && typeFilter === 'PORTFOLIO' ? 'PORTFOLIO' : (r?.type ?? 'RESUME');
    setForm(r
      ? { title: r.title, type: r.type, content: r.content ?? '', targetCompany: r.targetCompany ?? '', targetPosition: r.targetPosition ?? '', version: r.version, isTemplate: r.isTemplate }
      : { ...DEF_FORM, type: defaultType });
    const isPortfolio = r ? r.type === 'PORTFOLIO' : typeFilter === 'PORTFOLIO';
    if (isPortfolio) {
      setPortfolioContent(parsePortfolioContent(r?.content));
    } else {
      setContent(parseContent(r?.content));
    }
    setEditSection(null); setEditIndex(null);
    setDrafts({ ...DEFAULTS });
    setShowModal(true);
  }
  function closeModal() { setShowModal(false); setEditing(null); setEditSection(null); setEditIndex(null); setPendingFile(null); }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const finalContent = form.type === 'PORTFOLIO' ? JSON.stringify(portfolioContent) : JSON.stringify(content);
    const finalForm = { ...form, content: finalContent };
    editing ? updateM.mutate({ id: editing.id, data: finalForm }) : createM.mutate(finalForm);
  }

  // ── Resume section handlers ──────────────────────────────────────────────────
  function startAdd(section: keyof ResumeContent) {
    setEditSection(section); setEditIndex('new');
    setDrafts(d => ({ ...d, [section]: JSON.parse(JSON.stringify(DEFAULTS[section])) }));
  }
  function startEdit(section: keyof ResumeContent, index: number) {
    setEditSection(section); setEditIndex(index);
    setDrafts(d => ({ ...d, [section]: JSON.parse(JSON.stringify((content[section] as any[])[index])) }));
  }
  function saveDraft() {
    if (!editSection || editIndex === null) return;
    const items = [...(content[editSection] as any[])];
    if (editIndex === 'new') items.push(drafts[editSection]);
    else items[editIndex] = drafts[editSection];
    setContent(c => ({ ...c, [editSection]: items }));
    setEditSection(null); setEditIndex(null);
  }
  function cancelDraft() { setEditSection(null); setEditIndex(null); }
  function deleteItem(section: keyof ResumeContent, index: number) {
    setContent(c => ({ ...c, [section]: (c[section] as any[]).filter((_, i) => i !== index) }));
    if (editSection === section) { setEditSection(null); setEditIndex(null); }
  }
  function setDraftVal<S extends keyof DraftMap>(section: S, val: DraftMap[S]) {
    setDrafts(d => ({ ...d, [section]: val }));
  }

  // ── Portfolio link handlers ──────────────────────────────────────────────────
  function addLink() { setPortfolioContent(p => ({ ...p, links: [...p.links, { label: '', url: '' }] })); }
  function removeLink(i: number) { setPortfolioContent(p => ({ ...p, links: p.links.filter((_, idx) => idx !== i) })); }
  function updateLink(i: number, key: keyof PortfolioLink, value: string) {
    setPortfolioContent(p => ({ ...p, links: p.links.map((l, idx) => idx === i ? { ...l, [key]: value } : l) }));
  }

  function renderSection(
    section: keyof ResumeContent, title: string,
    sumFn: (item: any) => string,
    Form: React.ComponentType<{ d: any; set: (v: any) => void }>,
  ) {
    const items = content[section] as any[];
    return (
      <SectionCard title={title} count={items.length} onAdd={() => startAdd(section)}>
        {items.map((item, i) => (
          <div key={i}>
            {editSection === section && editIndex === i
              ? <FormPanel onSave={saveDraft} onCancel={cancelDraft}><Form d={drafts[section]} set={v => setDraftVal(section, v)} /></FormPanel>
              : <ItemRow summary={sumFn(item)} onEdit={() => startEdit(section, i)} onDelete={() => deleteItem(section, i)} />}
          </div>
        ))}
        {editSection === section && editIndex === 'new' && (
          <FormPanel onSave={saveDraft} onCancel={cancelDraft}><Form d={drafts[section]} set={v => setDraftVal(section, v)} /></FormPanel>
        )}
      </SectionCard>
    );
  }

  const setF = (k: keyof ResumeRequest) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }));
  const isPortfolioFilter = typeFilter === 'PORTFOLIO';
  const modalTitle = editing
    ? (editing.type === 'PORTFOLIO' ? '포트폴리오 수정' : '이력서 수정')
    : (form.type === 'PORTFOLIO' ? '포트폴리오 추가' : '이력서 추가');

  return (
    <div>
      <input type="file" ref={fileRef} onChange={e => { if (uploadTarget && e.target.files?.[0]) uploadM.mutate({ id: uploadTarget, file: e.target.files[0] }); }} className="hidden" accept=".pdf,.doc,.docx,.hwp" />
      <PageHeader
        title="이력서 · 포트폴리오"
        action={<Btn onClick={() => openModal()}><Plus className="w-4 h-4" />{isPortfolioFilter ? '포트폴리오 추가' : '이력서 추가'}</Btn>}
      />

      <div className="flex gap-1.5 mb-5">
        {(['ALL', ...RESUME_TYPES.map(t => t.value)] as const).map(t => (
          <button key={t} onClick={() => setTypeFilter(t as ResumeType | 'ALL')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${typeFilter === t ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm border border-gray-200'}`}>
            {t === 'ALL' ? '전체' : RESUME_TYPES.find(tp => tp.value === t)?.label ?? t}
          </button>
        ))}
      </div>

      {isLoading ? <Spinner /> : list.length === 0 ? <Empty message={isPortfolioFilter ? '등록된 포트폴리오가 없습니다' : '등록된 이력서가 없습니다'} /> : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b"><tr>
              {['제목', '유형', '내용', '파일', '태그', '등록일', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y">
              {list.map(r => {
                const isPortfolio = r.type === 'PORTFOLIO';
                const badge = isPortfolio
                  ? (() => {
                      const pc = parsePortfolioContent(r.content);
                      return pc.links.length > 0
                        ? pc.links.map(l => l.label || l.url.split('/')[2] || l.url).filter(Boolean).join(' · ')
                        : '';
                    })()
                  : contentBadge(parseContent(r.content));
                return (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{r.title}{r.isTemplate && <span className="ml-2 text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded">템플릿</span>}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{[r.targetCompany, r.targetPosition].filter(Boolean).join(' · ')}{r.version > 1 && <span className="ml-1.5 text-blue-400">v{r.version}</span>}</p>
                    </td>
                    <td className="px-4 py-3"><span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{r.typeLabel}</span></td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate">
                      {badge || <span className="text-gray-300">{isPortfolio ? '링크 없음' : '항목 없음'}</span>}
                    </td>
                    <td className="px-4 py-3">
                      {r.fileUrl
                        ? <div className="flex items-center gap-1">
                            <a href={r.fileUrl} className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700"><FileDown className="w-3.5 h-3.5" />{r.originalFileName?.split('_').slice(1).join('_') || '파일'}</a>
                            <button onClick={() => delFileM.mutate(r.id)}><X className="w-3 h-3 text-gray-300 hover:text-red-500" /></button>
                          </div>
                        : <button onClick={() => { setUploadTarget(r.id); fileRef.current?.click(); }} className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-500"><Upload className="w-3.5 h-3.5" />업로드</button>}
                    </td>
                    <td className="px-4 py-3"><div className="flex gap-1">{r.tags.map(t => <TagBadge key={t.id} name={t.name} color={t.color} />)}</div></td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{fmt(r.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => copyM.mutate(r.id)} title="버전 복사" className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-violet-600"><Copy className="w-3.5 h-3.5" /></button>
                        <button onClick={() => openModal(r)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => { if (confirm(`"${r.title}"을 삭제하시겠습니까?`)) deleteM.mutate(r.id); }} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showModal} onClose={closeModal} title={modalTitle} size="xl">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Field label="제목" required><Input value={form.title} onChange={setF('title')} required placeholder={form.type === 'PORTFOLIO' ? '포트폴리오 제목' : '이력서 제목'} /></Field></div>
            <Field label="유형"><Select value={form.type} onChange={setF('type')}>{RESUME_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</Select></Field>
            <Field label="버전"><Input type="number" min={1} value={form.version ?? 1} onChange={setF('version')} /></Field>
            <Field label="대상 기업"><Input value={form.targetCompany ?? ''} onChange={setF('targetCompany')} placeholder="카카오" /></Field>
            <Field label="대상 직무"><Input value={form.targetPosition ?? ''} onChange={setF('targetPosition')} placeholder="백엔드 개발자" /></Field>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isTemplate} onChange={e => setForm(f => ({ ...f, isTemplate: e.target.checked }))} className="w-4 h-4 accent-blue-600" />
            <span className="text-sm text-gray-700">템플릿으로 저장</span>
          </label>

          {form.type === 'PORTFOLIO' ? (
            <div className="space-y-4 border-t pt-4">
              {/* Links */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b">
                  <span className="text-sm font-semibold text-gray-700">링크 <span className="text-xs font-normal text-gray-400">({portfolioContent.links.length})</span></span>
                  <button type="button" onClick={addLink} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"><PlusCircle className="w-3.5 h-3.5" />링크 추가</button>
                </div>
                <div>
                  {portfolioContent.links.length === 0 && (
                    <div className="flex flex-col items-center py-6 gap-2 text-gray-400">
                      <Link2 className="w-8 h-8 text-gray-300" />
                      <p className="text-xs">GitHub, Notion, Figma, 배포 URL 등 링크를 추가하세요</p>
                    </div>
                  )}
                  {portfolioContent.links.map((link, i) => (
                    <div key={i} className="flex items-center gap-2 px-4 py-2.5 border-b last:border-b-0">
                      <input
                        className="w-28 shrink-0 px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="GitHub"
                        value={link.label}
                        onChange={e => updateLink(i, 'label', e.target.value)}
                      />
                      <input
                        className="flex-1 px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="https://github.com/username/project"
                        value={link.url}
                        onChange={e => updateLink(i, 'url', e.target.value)}
                      />
                      <button type="button" onClick={() => removeLink(i)} className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 shrink-0"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>
              {/* File Attach */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b">
                  <span className="text-sm font-semibold text-gray-700">파일 첨부</span>
                  <span className="ml-1.5 text-xs text-gray-400">PDF, Word, HWP</span>
                </div>
                <div className="px-4 py-3">
                  <input
                    ref={modalFileRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.hwp"
                    onChange={e => { if (e.target.files?.[0]) { setPendingFile(e.target.files[0]); e.target.value = ''; } }}
                  />
                  {pendingFile ? (
                    <div className="flex items-center gap-2">
                      <FileDown className="w-4 h-4 text-green-500 shrink-0" />
                      <span className="text-sm text-gray-700 truncate">{pendingFile.name}</span>
                      <button type="button" onClick={() => setPendingFile(null)} className="p-0.5 rounded text-gray-300 hover:text-red-500 shrink-0"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ) : editing?.fileUrl ? (
                    <div className="flex items-center gap-2">
                      <FileDown className="w-4 h-4 text-blue-400 shrink-0" />
                      <a href={editing.fileUrl} className="text-sm text-blue-500 hover:text-blue-700 truncate">{editing.originalFileName?.split('_').slice(1).join('_') || '첨부파일'}</a>
                      <button type="button" onClick={() => delFileM.mutate(editing.id)} className="p-0.5 rounded text-gray-300 hover:text-red-500 shrink-0" title="삭제"><X className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => modalFileRef.current?.click()} className="ml-1 text-xs text-blue-400 hover:text-blue-600">교체</button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => modalFileRef.current?.click()} className="flex items-center gap-2 text-sm text-gray-400 hover:text-blue-500 transition-colors">
                      <Upload className="w-4 h-4" />
                      <span>파일 선택</span>
                    </button>
                  )}
                </div>
              </div>
              {/* Description */}
              <Field label="설명 (선택)">
                <Textarea
                  value={portfolioContent.description}
                  onChange={e => setPortfolioContent(p => ({ ...p, description: e.target.value }))}
                  placeholder="포트폴리오에 대한 간단한 설명을 입력하세요"
                  rows={4}
                />
              </Field>
            </div>
          ) : (
            <div className="space-y-3 border-t pt-4">
              {renderSection('education',      '학력',      eduSum,   EduForm)}
              {renderSection('career',         '경력',      carSum,   CareerForm)}
              {renderSection('certifications', '자격증',    certSum,  CertForm)}
              {renderSection('awards',         '수상',      awarSum,  AwardForm)}
              {renderSection('languages',      '어학',      langSum,  LangForm)}
              {renderSection('skills',         '기술/역량', skillSum, SkillForm)}
              {renderSection('activities',     '활동/경험', actSum,   ActivityForm)}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Btn type="button" variant="secondary" onClick={closeModal}>취소</Btn>
            <Btn type="submit" disabled={createM.isPending || updateM.isPending}>저장</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
