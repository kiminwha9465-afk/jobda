import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { tagsApi } from '../api';
import type { TagResponse } from '../types';
import { Btn, Spinner, Empty, PageHeader } from '../components/ui';

const COLORS = ['#6366f1','#8b5cf6','#ec4899','#f43f5e','#f97316','#eab308','#22c55e','#14b8a6','#06b6d4','#3b82f6','#64748b','#78716c'];

export default function Tags() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);

  const { data: list = [], isLoading } = useQuery({ queryKey: ['tags'], queryFn: () => tagsApi.list() });

  const inv = () => qc.invalidateQueries({ queryKey: ['tags'] });
  const createM = useMutation({ mutationFn: tagsApi.create, onSuccess: () => { inv(); cancelCreate(); } });
  const updateM = useMutation({ mutationFn: ({ id, data }: { id: number; data: { name: string; color: string } }) => tagsApi.update(id, data), onSuccess: () => { inv(); setEditId(null); } });
  const deleteM = useMutation({ mutationFn: tagsApi.delete, onSuccess: inv });

  function cancelCreate() { setCreating(false); setName(''); setColor(COLORS[0]); }
  function startEdit(t: TagResponse) { setEditId(t.id); setName(t.name); setColor(t.color ?? COLORS[0]); }
  function cancelEdit() { setEditId(null); setName(''); setColor(COLORS[0]); }
  function submitCreate(e: React.FormEvent) { e.preventDefault(); if (name.trim()) createM.mutate({ name: name.trim(), color }); }
  function submitEdit(e: React.FormEvent) { e.preventDefault(); if (editId && name.trim()) updateM.mutate({ id: editId, data: { name: name.trim(), color } }); }
  function del(t: TagResponse) { if (confirm(`"${t.name}" 태그를 삭제하시겠습니까?`)) deleteM.mutate(t.id); }

  return (
    <div>
      <PageHeader title="태그" action={<Btn onClick={() => { setCreating(true); setEditId(null); }}><Plus className="w-4 h-4" />태그 추가</Btn>} />

      {creating && (
        <form onSubmit={submitCreate} className="bg-white rounded-xl shadow-sm p-4 mb-4 flex items-center gap-3">
          <div className="flex gap-1.5 flex-wrap">
            {COLORS.map(c => (
              <button key={c} type="button" onClick={() => setColor(c)}
                className={`w-5 h-5 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-offset-1 ring-gray-400' : ''}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="태그 이름" autoFocus
            className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-400" />
          <div className="flex gap-1">
            <button type="submit" disabled={!name.trim()} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-40"><Check className="w-4 h-4" /></button>
            <button type="button" onClick={cancelCreate} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
          </div>
        </form>
      )}

      {isLoading ? <Spinner /> : list.length === 0 ? <Empty message="등록된 태그가 없습니다" /> : (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex flex-wrap gap-3">
            {list.map(t => (
              <div key={t.id}>
                {editId === t.id ? (
                  <form onSubmit={submitEdit} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                    <div className="flex gap-1 flex-wrap">
                      {COLORS.map(c => (
                        <button key={c} type="button" onClick={() => setColor(c)}
                          className={`w-4 h-4 rounded-full ${color === c ? 'scale-125 ring-1 ring-offset-1 ring-gray-400' : ''}`}
                          style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <input value={name} onChange={e => setName(e.target.value)} autoFocus
                      className="w-24 px-2 py-0.5 border border-gray-300 rounded text-sm outline-none focus:border-blue-400" />
                    <button type="submit" disabled={!name.trim()} className="text-blue-500 hover:text-blue-700 disabled:opacity-40"><Check className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={cancelEdit} className="text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
                  </form>
                ) : (
                  <div className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 hover:border-gray-300 transition-colors">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: t.color ?? '#94a3b8' }} />
                    <span className="text-sm font-medium text-gray-700">{t.name}</span>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                      <button onClick={() => startEdit(t)} className="p-0.5 text-gray-300 hover:text-blue-500"><Pencil className="w-3 h-3" /></button>
                      <button onClick={() => del(t)} className="p-0.5 text-gray-300 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
