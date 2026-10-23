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
    <div className="mt-3 rounded-xl overflow-hidden border border-[var(--upt-surface-border)] bg-[var(--upt-surface)] shadow-[var(--upt-shadow-sm)]">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--upt-surface-border)] bg-[var(--upt-surface-light)]">
        <Code2 className="w-4 h-4 text-[var(--upt-gold)] shrink-0" />
        <p className="text-[11px] font-bold text-[var(--upt-text-secondary)] uppercase tracking-wider">
          Completa el Código
        </p>
      </div>

      {/* Question */}
      <div className="px-4 pt-4 pb-3">
        <p className="text-[14px] font-medium text-[var(--upt-text-primary)] leading-relaxed">
          {question}
        </p>
      </div>

      {/* Code snippet with input */}
      <div className="mx-4 mb-4">
        <div className="bg-[var(--upt-bg-deep)] rounded-xl border border-[var(--upt-surface-border)] px-4 py-4 font-mono text-[14px] flex items-center flex-wrap gap-0 shadow-inner">
          <span className="text-[var(--upt-info)]">{parts[0]}</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={status === 'correct'}
            placeholder="___"
            className={`inline-block bg-[var(--upt-surface)] outline-none border rounded px-2 py-0.5 text-center transition-colors mx-2 placeholder:text-[var(--upt-text-tertiary)] shadow-sm ${
              status === 'correct' ? 'border-[var(--upt-success)] text-[var(--upt-success)] bg-[var(--upt-success)]/10' :
              status === 'wrong' ? 'border-[var(--upt-error)] text-[var(--upt-error)] bg-[var(--upt-error)]/10 animate-bounce' :
              'border-[var(--upt-gold)] text-[var(--upt-gold)] focus:border-[var(--upt-gold)] focus:ring-1 focus:ring-[var(--upt-gold)]'
            }`}
            style={{ minWidth: '3ch', width: `${Math.max(input.length, 3) + 2}ch` }}
          />
          <span className="text-[var(--upt-info)]">{parts[1] || ''}</span>
        </div>

        {/* Check button */}
        {status !== 'correct' && (
          <button
            onClick={handleCheck}
            disabled={!input.trim()}
            className="mt-3 w-full py-2.5 rounded-xl bg-[var(--upt-surface-light)] hover:bg-[var(--upt-surface)] border border-[var(--upt-surface-border)] hover:border-[var(--upt-gold)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--upt-text-secondary)] hover:text-[var(--upt-text-primary)] text-[12px] font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
          >
            Verificar
          </button>
        )}

        {/* Status */}
        {status === 'correct' && (
          <div className="mt-3 flex items-center gap-2 text-[var(--upt-success)] text-[13px] font-bold">
            <CheckCircle2 className="w-4 h-4" /> ¡Exacto!
          </div>
        )}
        {status === 'wrong' && (
          <div className="mt-3 flex items-center gap-2 text-[var(--upt-error)] text-[13px] font-bold">
            <XCircle className="w-4 h-4" /> No es correcto. Inténtalo de nuevo...
          </div>
        )}
      </div>

      {/* Explanation */}
      {showExplanation && (
        <div className="mx-4 mb-4 px-4 py-3 rounded-xl border bg-[var(--upt-success)]/10 border-[var(--upt-success)]/30 text-[var(--upt-success)] text-[13px] leading-relaxed shadow-sm">
          <span className="font-bold mr-2 text-[var(--upt-success)]">✓ Explicación:</span>
          {explanation}
        </div>
      )}
    </div>
  );
}
