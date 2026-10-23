import { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

export default function InteractiveTrueFalse({ interaction }) {
  const [selected, setSelected] = useState(null);
  const submitted = selected !== null;
  const isCorrect = submitted && selected === interaction.correct_answer;

  return (
    <div className="mt-3 p-4 rounded-xl border border-[var(--upt-surface-border)] bg-[var(--upt-bg)]">
      <p className="text-[12px] font-bold text-[var(--upt-text-secondary)] mb-3">¿Verdadero o falso?</p>
      
      <div className="bg-[var(--upt-surface)] border border-[var(--upt-surface-border)] rounded-lg p-3 mb-3">
        <p className="text-[13px] text-[var(--upt-text-primary)] italic leading-relaxed">
          "{interaction.statement}"
        </p>
      </div>

      <div className="flex gap-2">
        {[
          { label: '✓ Verdadero', value: true },
          { label: '✗ Falso', value: false },
        ].map(opt => {
          const isThis = selected === opt.value;
          const showCorrect = submitted && opt.value === interaction.correct_answer;
          const showWrong = submitted && isThis && !isCorrect;

          return (
            <button
              key={String(opt.value)}
              onClick={() => !submitted && setSelected(opt.value)}
              disabled={submitted}
              className={`flex-1 py-3 rounded-lg text-[13px] font-bold transition-all border cursor-pointer ${
                showCorrect
                  ? 'bg-[var(--upt-success)]/10 border-[var(--upt-success)]/40 text-[var(--upt-success)]'
                  : showWrong
                  ? 'bg-[var(--upt-error)]/10 border-[var(--upt-error)]/40 text-[var(--upt-error)]'
                  : 'bg-[var(--upt-surface)] border-[var(--upt-surface-border)] text-[var(--upt-text-secondary)] hover:border-[var(--upt-gold)]/30 hover:bg-[var(--upt-surface-light)]'
              } disabled:cursor-default`}
            >
              {opt.label}
            </button>
          );
        })}
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
          <p className="text-[11px] text-[var(--upt-text-secondary)]">
            {interaction.explanation}
          </p>
        </div>
      )}
    </div>
  );
}
