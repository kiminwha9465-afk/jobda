import { useState } from 'react';
import { Btn, PageHeader } from '../components/ui';
import { CheckCircle, ClipboardPaste, Trash2, ExternalLink } from 'lucide-react';

export default function WritingTools() {
  const [text, setText] = useState('');
  const [charLimit, setCharLimit] = useState<number | ''>('');
  const [copied, setCopied] = useState(false);

  const charCount = text.length;
  const limit = typeof charLimit === 'number' ? charLimit : null;
  const overLimit = limit !== null && charCount > limit;
  const nearLimit = limit !== null && charCount > limit * 0.9;

  function openSpellChecker() {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://dic.daum.net/grammar_checker.do';
    form.target = '_blank';
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'sentence';
    input.value = text;
    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  }

  function handlePaste() {
    navigator.clipboard.readText().then(t => setText(prev => prev + t));
  }

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div>
      <PageHeader title="글쓰기 도구" />

      <div className="bg-white rounded-xl shadow-sm p-5 flex flex-col gap-4 max-w-3xl">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700">텍스트 입력</p>
          <div className="flex items-center gap-2">
            <button onClick={handlePaste} title="클립보드에서 붙여넣기"
              className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600">
              <ClipboardPaste className="w-4 h-4" />
            </button>
            <button onClick={() => setText('')} title="초기화"
              className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="텍스트를 입력하세요..."
          className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
          rows={16}
        />

        {/* 글자수 표시 */}
        <div className="flex items-center gap-3">
          <span className={`text-sm font-semibold ${overLimit ? 'text-red-500' : nearLimit ? 'text-orange-500' : 'text-gray-700'}`}>
            {charCount.toLocaleString()}자
          </span>
          {limit !== null && (
            <>
              <span className="text-sm text-gray-400">/ {limit.toLocaleString()}자</span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${overLimit ? 'bg-red-500' : nearLimit ? 'bg-orange-400' : 'bg-blue-500'}`}
                  style={{ width: `${Math.min((charCount / limit) * 100, 100)}%` }}
                />
              </div>
              {overLimit && (
                <span className="text-xs text-red-500 shrink-0">{charCount - limit}자 초과</span>
              )}
            </>
          )}
        </div>

        {/* 글자 수 제한 설정 */}
        <div className="flex items-center gap-2 border-t pt-3">
          <label className="text-xs text-gray-500 shrink-0">글자 수 제한</label>
          <input
            type="number"
            min={0}
            value={charLimit}
            onChange={e => setCharLimit(e.target.value ? Number(e.target.value) : '')}
            placeholder="예: 500"
            className="w-28 px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {charLimit !== '' && (
            <button onClick={() => setCharLimit('')} className="text-xs text-gray-400 hover:text-gray-600">초기화</button>
          )}
        </div>

        {/* 버튼 영역 */}
        <div className="flex gap-2 border-t pt-3">
          <Btn onClick={handleCopy} variant="secondary" disabled={!text.trim()}>
            {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <ClipboardPaste className="w-4 h-4" />}
            {copied ? '복사됨' : '텍스트 복사'}
          </Btn>
          <Btn onClick={openSpellChecker} disabled={!text.trim()}>
            <ExternalLink className="w-4 h-4" />
            맞춤법 검사 (Daum)
          </Btn>
        </div>

        <p className="text-xs text-gray-400">
          맞춤법 검사 버튼을 누르면 Daum 맞춤법 검사기 새 탭에서 결과를 확인할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
