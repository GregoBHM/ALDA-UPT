import { useState, useRef, useEffect } from 'react';
import { Terminal } from 'lucide-react';

const lineStyles = {
  error:   'text-red-400 font-semibold',
  warning: 'text-amber-400 font-medium',
  success: 'text-emerald-400 font-semibold',
  system:  'text-[var(--upt-text-tertiary)] italic',
  stdout:  'text-[var(--upt-text-primary)] font-mono',
  stdin:   'text-white font-mono',
};

export default function ConsolePanel({ isExecuting, output, onSendInput }) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [output, isExecuting]);

  useEffect(() => {
    if (isExecuting && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExecuting]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSendInput) {
      onSendInput(inputValue);
      setInputValue('');
    }
  };

  return (
    <div className="h-36 sm:h-48 md:h-56 bg-[var(--upt-bg-deep)] border-t border-white/[0.06] flex flex-col shrink-0" onClick={() => isExecuting && inputRef.current?.focus()}>
      <div className="flex px-6 pt-3 bg-[var(--upt-bg-deep)] gap-6 text-xs font-bold uppercase tracking-wider border-b border-white/[0.06]">
        <button className="text-[var(--upt-gold)] border-b-2 border-[var(--upt-gold)] pb-2 flex items-center gap-2 cursor-default">
          <Terminal className="w-3.5 h-3.5" />
          Terminal Interactiva
          {isExecuting && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />}
        </button>
      </div>

      <div ref={containerRef} className="flex-1 p-5 font-mono text-sm overflow-y-auto w-full relative bg-[#0a0a1e] mx-2 my-2 rounded-xl border border-white/[0.05] shadow-inner">
        {output.length === 0 && !isExecuting ? (
          <div className="text-[var(--upt-text-tertiary)]/40 font-mono text-[13px] flex items-center gap-1.5">
            <span className="w-[7px] h-4 bg-[var(--upt-text-tertiary)]/30 rounded-[1px] animate-pulse" />
            <span className="text-[11px] opacity-40">Esperando ejecución...</span>
          </div>
        ) : (
          <div>
            {output.map((line, idx) => (
              <div key={idx} className={`whitespace-pre-wrap leading-relaxed ${lineStyles[line.type] || 'text-[var(--upt-text-secondary)]'}`}>
                {line.text}
              </div>
            ))}
            {isExecuting && (
              <form onSubmit={handleSubmit} className="inline-flex items-center gap-1.5 mt-1 w-full">
                <span className="text-[var(--upt-gold)] font-bold text-xs">{'>'}</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-[var(--upt-text-primary)] font-mono caret-[var(--upt-gold)] min-w-[50px]"
                  placeholder="Escribe aquí tu entrada para el programa..."
                  autoComplete="off"
                  spellCheck="false"
                />
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
