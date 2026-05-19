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
    <div className="mt-3 rounded-xl overflow-hidden border border-[var(--upt-gold)]/15 bg-[var(--upt-surface)]">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--upt-gold)]/10">
        <HelpCircle className="w-3.5 h-3.5 text-[var(--upt-gold)]/60 shrink-0" />
        <p className="text-[11px] font-semibold text-[var(--upt-gold)]/70 uppercase tracking-wider">
          Reflexiona
        </p>
      </div>

      {/* Question */}
      <div className="px-4 pt-3 pb-2">
        <p className="text-[13px] font-medium text-[var(--upt-text-primary)] leading-relaxed">
          {question}
        </p>
      </div>

      {/* Options */}
      <div className="px-4 pb-4 flex flex-col gap-2">
        {options.map((option, idx) => {
          let style = 'border-white/[0.07] bg-[var(--upt-surface-light)] hover:border-[var(--upt-gold)]/25 hover:text-[var(--upt-text-primary)] cursor-pointer text-[var(--upt-text-secondary)]';
          let icon = null;

          if (answered) {
            if (idx === correct_index) {
              style = 'border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-300 cursor-default';
              icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
            } else if (idx === selected && selected !== correct_index) {
              style = 'border-rose-500/30 bg-rose-500/[0.06] text-rose-400 cursor-default';
              icon = <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
            } else {
              style = 'border-white/[0.04] bg-transparent opacity-40 cursor-default text-[var(--upt-text-tertiary)]';
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              className={`w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-lg border text-[12px] font-medium transition-colors ${style}`}
            >
              <span className={`w-5 h-5 shrink-0 rounded-md border flex items-center justify-center text-[10px] font-bold ${
                answered && idx === correct_index ? 'border-emerald-500/50 text-emerald-400' :
                answered && idx === selected && selected !== correct_index ? 'border-rose-500/50 text-rose-400' :
                'border-white/20 text-[var(--upt-text-tertiary)]'
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
        <div className={`mx-4 mb-4 px-3 py-2.5 rounded-lg border text-[12px] leading-relaxed ${
          isCorrect
            ? 'bg-emerald-500/[0.06] border-emerald-500/20 text-emerald-300'
            : 'bg-[var(--upt-gold)]/[0.06] border-[var(--upt-gold)]/20 text-[var(--upt-gold)]/80'
        }`}>
          <span className="font-semibold mr-1">{isCorrect ? '✓ Correcto.' : '→ Pista:'}</span>
          {explanation}
        </div>
      )}
    </div>
  );
}
