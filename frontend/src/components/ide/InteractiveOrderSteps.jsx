import { useState, useCallback } from 'react';
import { CheckCircle, XCircle, GripVertical } from 'lucide-react';

export default function InteractiveOrderSteps({ interaction }) {
  const [items, setItems] = useState(() => [...interaction.steps_shuffled]);
  const [submitted, setSubmitted] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);

  const correctOrder = interaction.correct_order.map(i => interaction.steps_shuffled[i]);
  const isCorrect = submitted && items.every((item, i) => item === correctOrder[i]);

  const handleDragStart = (index) => {
    setDragIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const newItems = [...items];
    const [moved] = newItems.splice(dragIndex, 1);
    newItems.splice(index, 0, moved);
    setItems(newItems);
    setDragIndex(index);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
  };

  const moveItem = (from, to) => {
    if (submitted) return;
    const newItems = [...items];
    const [moved] = newItems.splice(from, 1);
    newItems.splice(to, 0, moved);
    setItems(newItems);
  };

  return (
    <div className="mt-3 p-4 rounded-xl border border-[var(--upt-surface-border)] bg-[var(--upt-bg)]">
      <p className="text-[12px] font-bold text-[var(--upt-text-secondary)] mb-3">{interaction.question}</p>
      
      <div className="space-y-1.5 mb-3">
        {items.map((step, i) => {
          const isItemCorrect = submitted && step === correctOrder[i];
          const isItemWrong = submitted && step !== correctOrder[i];

          return (
            <div
              key={step}
              draggable={!submitted}
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-2 p-2.5 rounded-lg border transition-all ${
                dragIndex === i
                  ? 'opacity-50 border-[var(--upt-gold)]/40 bg-[var(--upt-gold)]/5'
                  : isItemCorrect
                  ? 'border-[var(--upt-success)]/30 bg-[var(--upt-success)]/5'
                  : isItemWrong
                  ? 'border-[var(--upt-error)]/30 bg-[var(--upt-error)]/5'
                  : 'border-[var(--upt-surface-border)] bg-[var(--upt-surface)] hover:border-[var(--upt-gold)]/20'
              } ${!submitted ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
            >
              <div className="flex items-center gap-1.5 shrink-0">
                {!submitted && <GripVertical className="w-3.5 h-3.5 text-[var(--upt-text-tertiary)]" />}
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                  isItemCorrect ? 'bg-[var(--upt-success)]/20 text-[var(--upt-success)]'
                  : isItemWrong ? 'bg-[var(--upt-error)]/20 text-[var(--upt-error)]'
                  : 'bg-[var(--upt-surface-light)] text-[var(--upt-text-tertiary)]'
                }`}>
                  {i + 1}
                </span>
              </div>
              <span className="text-[12px] text-[var(--upt-text-primary)] font-medium flex-1">{step}</span>
              {!submitted && i > 0 && (
                <button onClick={() => moveItem(i, i - 1)} className="text-[var(--upt-text-tertiary)] hover:text-[var(--upt-text-primary)] text-[10px] cursor-pointer">▲</button>
              )}
              {!submitted && i < items.length - 1 && (
                <button onClick={() => moveItem(i, i + 1)} className="text-[var(--upt-text-tertiary)] hover:text-[var(--upt-text-primary)] text-[10px] cursor-pointer">▼</button>
              )}
            </div>
          );
        })}
      </div>

      {!submitted && (
        <button
          onClick={() => setSubmitted(true)}
          className="w-full py-2.5 bg-[var(--upt-accent)] hover:bg-[var(--upt-accent-light)] text-white rounded-lg text-[12px] font-bold transition-colors cursor-pointer"
        >
          Verificar orden
        </button>
      )}

      {submitted && (
        <div className={`flex items-start gap-2 p-3 rounded-lg border ${
          isCorrect 
            ? 'bg-[var(--upt-success)]/5 border-[var(--upt-success)]/20'
            : 'bg-[var(--upt-error)]/5 border-[var(--upt-error)]/20'
        }`}>
          {isCorrect 
            ? <CheckCircle className="w-4 h-4 text-[var(--upt-success)] shrink-0 mt-0.5" />
            : <XCircle className="w-4 h-4 text-[var(--upt-error)] shrink-0 mt-0.5" />}
          <div>
            <p className={`text-[12px] font-bold ${isCorrect ? 'text-[var(--upt-success)]' : 'text-[var(--upt-error)]'}`}>
              {isCorrect ? '¡Orden correcto!' : 'Revisa el orden'}
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
