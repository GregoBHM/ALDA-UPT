import { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

export default function InteractiveCodeTrace({ interaction }) {
  const [userAnswer, setUserAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const isCorrect = submitted && userAnswer.trim() === String(interaction.answer).trim();

  const handleSubmit = () => {
    if (!userAnswer.trim()) return;
    setSubmitted(true);
  };

  return (
    <div className="mt-3 p-4 rounded-xl border border-[var(--upt-surface-border)] bg-[var(--upt-bg)]">
      <p className="text-[12px] font-bold text-[var(--upt-text-secondary)] mb-3">{interaction.question}</p>
      
      {interaction.code_snippet && (
        <pre className="bg-[var(--upt-surface)] border border-[var(--upt-surface-border)] rounded-lg p-3 text-[12px] font-mono text-[var(--upt-text-primary)] mb-3 overflow-x-auto leading-relaxed">
          {interaction.code_snippet}
        </pre>
      )}

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={userAnswer}
          onChange={e => setUserAnswer(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          disabled={submitted}
          className="flex-1 bg-[var(--upt-surface)] border border-[var(--upt-surface-border)] rounded-lg px-3 py-2 text-[13px] font-mono text-[var(--upt-text-primary)] placeholder:text-[var(--upt-text-tertiary)] focus:outline-none focus:border-[var(--upt-gold)]/40 disabled:opacity-60"
          placeholder="Tu respuesta..."
        />
        {!submitted && (
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-[var(--upt-accent)] hover:bg-[var(--upt-accent-light)] text-white rounded-lg text-[12px] font-bold transition-colors cursor-pointer"
          >
            Verificar
          </button>
        )}
      </div>

      {submitted && (
        <div className={`mt-3 flex items-start gap-2 p-3 rounded-lg border ${
          isCorrect 
            ? 'bg-[var(--upt-success)]/5 border-[var(--upt-success)]/20' 
            : 'bg-[var(--upt-error)]/5 border-[var(--upt-error)]/20'
        }`}>
          {isCorrect 
            ? <CheckCircle className="w-4 h-4 text-[var(--upt-success)] shrink-0 mt-0.5" />
            : <XCircle className="w-4 h-4 text-[var(--upt-error)] shrink-0 mt-0.5" />}
          <div>
            <p className={`text-[12px] font-bold ${isCorrect ? 'text-[var(--upt-success)]' : 'text-[var(--upt-error)]'}`}>
              {isCorrect ? '¡Correcto!' : `Respuesta correcta: ${interaction.answer}`}
            </p>
            {interaction.explanation && (
              <p className="text-[11px] text-[var(--upt-text-secondary)] mt-1">{interaction.explanation}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
