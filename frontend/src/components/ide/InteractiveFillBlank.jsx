import { useState, useRef } from 'react';
import { CheckCircle2, XCircle, Code2 } from 'lucide-react';

export default function InteractiveFillBlank({ interaction }) {
  const [input, setInput] = useState('');
  const [status, setStatus] = useState(null); // null | 'correct' | 'wrong'
  const [showExplanation, setShowExplanation] = useState(false);
  const inputRef = useRef(null);

  if (!interaction || interaction.type !== 'fill_in_blank') return null;

  const { question, code_snippet, answer, explanation } = interaction;
  const parts = (code_snippet || '').split('__');

  const handleCheck = () => {
    if (!input.trim() || status === 'correct') return;
    const isCorrect = input.trim() === answer.trim();
    setStatus(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) {
      setTimeout(() => setShowExplanation(true), 500);
    } else {
      setTimeout(() => {
        setStatus(null);
        setInput('');
        inputRef.current?.focus();
      }, 1200);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') handleCheck();
  };

  return (
    <div className="mt-3 rounded-xl overflow-hidden border border-[var(--upt-gold)]/15 bg-[var(--upt-surface)]">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--upt-gold)]/10">
        <Code2 className="w-3.5 h-3.5 text-[var(--upt-gold)]/60 shrink-0" />
        <p className="text-[11px] font-semibold text-[var(--upt-gold)]/70 uppercase tracking-wider">
          Completa el Código
        </p>
      </div>

      {/* Question */}
      <div className="px-4 pt-3 pb-2">
        <p className="text-[13px] font-medium text-[var(--upt-text-primary)] leading-relaxed">
          {question}
        </p>
      </div>

      {/* Code snippet with input */}
      <div className="mx-4 mb-4">
        <div className="bg-[var(--upt-bg)] rounded-lg border border-white/[0.07] px-4 py-3 font-mono text-[13px] flex items-center flex-wrap gap-0">
          <span className="text-emerald-400/80">{parts[0]}</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={status === 'correct'}
            placeholder="___"
            className={`inline-block bg-transparent outline-none border-b text-center transition-colors w-12 mx-1 placeholder:text-white/20 ${
              status === 'correct' ? 'border-emerald-400/60 text-emerald-300' :
              status === 'wrong' ? 'border-rose-400/60 text-rose-300 animate-bounce' :
              'border-[var(--upt-gold)]/30 text-[var(--upt-gold)] focus:border-[var(--upt-gold)]/60'
            }`}
            style={{ width: `${Math.max(input.length, 3) + 2}ch` }}
          />
          <span className="text-emerald-400/80">{parts[1] || ''}</span>
        </div>

        {/* Check button */}
        {status !== 'correct' && (
          <button
            onClick={handleCheck}
            disabled={!input.trim()}
            className="mt-2.5 w-full py-2 rounded-lg bg-[var(--upt-surface-light)] hover:bg-[var(--upt-gold)]/10 border border-[var(--upt-gold)]/15 hover:border-[var(--upt-gold)]/30 disabled:opacity-30 disabled:cursor-not-allowed text-[var(--upt-text-secondary)] hover:text-[var(--upt-gold)] text-[12px] font-medium uppercase tracking-wider transition-colors"
          >
            Verificar
          </button>
        )}

        {/* Status */}
        {status === 'correct' && (
          <div className="mt-2 flex items-center gap-2 text-emerald-400 text-[12px] font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" /> ¡Exacto!
          </div>
        )}
        {status === 'wrong' && (
          <div className="mt-2 flex items-center gap-2 text-rose-400 text-[12px] font-medium">
            <XCircle className="w-3.5 h-3.5" /> No es correcto. Inténtalo de nuevo...
          </div>
        )}
      </div>

      {/* Explanation */}
      {showExplanation && (
        <div className="mx-4 mb-4 px-3 py-2.5 rounded-lg border bg-emerald-500/[0.06] border-emerald-500/20 text-emerald-300 text-[12px] leading-relaxed">
          <span className="font-semibold mr-1">✓ Explicación:</span>
          {explanation}
        </div>
      )}
    </div>
  );
}
