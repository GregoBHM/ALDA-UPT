import { useState } from 'react';
import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react';

export default function InteractiveQuiz({ interaction }) {
  const [selected, setSelected] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);

  if (!interaction || interaction.type !== 'multiple_choice') return null;

  const { question, options, correct_index, explanation } = interaction;

  const handleSelect = (idx) => {
    if (selected !== null) return;
    setSelected(idx);
    setTimeout(() => setShowExplanation(true), 600);
  };

  const isCorrect = selected === correct_index;
  const answered = selected !== null;

  return (
    <div className="mt-3 rounded-xl overflow-hidden border border-[var(--upt-surface-border)] bg-[var(--upt-surface)] shadow-[var(--upt-shadow-sm)]">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--upt-surface-border)] bg-[var(--upt-surface-light)]">
        <HelpCircle className="w-4 h-4 text-[var(--upt-gold)] shrink-0" />
        <p className="text-[11px] font-bold text-[var(--upt-text-secondary)] uppercase tracking-wider">
          Reflexiona
        </p>
      </div>

      {/* Question */}
      <div className="px-4 pt-4 pb-3">
        <p className="text-[14px] font-medium text-[var(--upt-text-primary)] leading-relaxed">
          {question}
        </p>
      </div>

      {/* Options */}
      <div className="px-4 pb-4 flex flex-col gap-2">
        {options.map((option, idx) => {
          let style = 'border-[var(--upt-surface-border)] bg-[var(--upt-surface-light)] hover:border-[var(--upt-gold)]/40 hover:text-[var(--upt-text-primary)] cursor-pointer text-[var(--upt-text-secondary)]';
          let icon = null;

          if (answered) {
            if (idx === correct_index) {
              style = 'border-[var(--upt-success)]/40 bg-[var(--upt-success)]/10 text-[var(--upt-success)] cursor-default font-bold';
              icon = <CheckCircle2 className="w-4 h-4 text-[var(--upt-success)] shrink-0" />;
            } else if (idx === selected && selected !== correct_index) {
              style = 'border-[var(--upt-error)]/40 bg-[var(--upt-error)]/10 text-[var(--upt-error)] cursor-default font-bold';
              icon = <XCircle className="w-4 h-4 text-[var(--upt-error)] shrink-0" />;
            } else {
              style = 'border-[var(--upt-surface-border)] bg-transparent opacity-50 cursor-default text-[var(--upt-text-tertiary)]';
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              className={`w-full flex items-center gap-3 text-left px-3 py-3 rounded-lg border text-[13px] font-medium transition-colors ${style}`}
            >
              <span className={`w-6 h-6 shrink-0 rounded-md border flex items-center justify-center text-[11px] font-bold bg-[var(--upt-bg)] ${
                answered && idx === correct_index ? 'border-[var(--upt-success)]/50 text-[var(--upt-success)]' :
                answered && idx === selected && selected !== correct_index ? 'border-[var(--upt-error)]/50 text-[var(--upt-error)]' :
                'border-[var(--upt-surface-border)] text-[var(--upt-text-tertiary)]'
              }`}>
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="flex-1">{option}</span>
              {icon}
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {showExplanation && (
        <div className={`mx-4 mb-4 px-4 py-3 rounded-xl border text-[13px] leading-relaxed shadow-[var(--upt-shadow-sm)] ${
          isCorrect
            ? 'bg-[var(--upt-success)]/10 border-[var(--upt-success)]/30 text-[var(--upt-success)]'
            : 'bg-[var(--upt-surface-light)] border-[var(--upt-gold)]/30 text-[var(--upt-text-secondary)]'
        }`}>
          <span className={`font-bold mr-2 ${isCorrect ? 'text-[var(--upt-success)]' : 'text-[var(--upt-gold)]'}`}>
            {isCorrect ? '✓ Correcto.' : '→ Pista:'}
          </span>
          {explanation}
        </div>
      )}
    </div>
  );
}
