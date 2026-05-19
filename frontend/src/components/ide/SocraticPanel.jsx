import { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, Loader2, X, Trash2, ThumbsUp, ThumbsDown, Lightbulb, Bug, HelpCircle, Repeat } from 'lucide-react';
import { askAssistant, rateAttempt } from '../../api';
import toast from 'react-hot-toast';
import InteractiveQuiz from './InteractiveQuiz';
import InteractiveFillBlank from './InteractiveFillBlank';

const INITIAL_SUGGESTIONS = [
  { icon: Bug, label: '¿Por qué me da error?', text: '¿Por qué mi código me da error? ¿Puedes guiarme para encontrar el problema?' },
  { icon: Lightbulb, label: 'Dame una pista', text: 'Estoy atascado con este problema. ¿Puedes darme una pista sin darme la respuesta directa?' },
  { icon: HelpCircle, label: 'Explicar concepto', text: '¿Puedes explicarme el concepto detrás de este ejercicio para entenderlo mejor?' },
  { icon: Repeat, label: 'Revisar mi lógica', text: 'Revisa la lógica de mi código y dime si mi enfoque es correcto.' },
];

const FOLLOWUP_SUGGESTIONS = [
  '¿Puedes darme otro ejemplo?',
  '¿Y si lo hago diferente?',
  'No entiendo, explica de nuevo',
  'Sí, ya lo entendí ✓',
];

export default function SocraticPanel({ messages, setMessages, onClose, code, language, laboratoryId, consoleOutput }) {
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Ratings persisted in localStorage so they survive page refresh
  const [ratings, setRatings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('alda_chat_ratings') || '{}');
    } catch { return {}; }
  });
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSubmitting]);

  const sendMessage = async (userText) => {
    if (isSubmitting || !userText.trim()) return;
    setInput('');
    setIsSubmitting(true);

    const updatedMessages = [
      ...messages,
      { id: Date.now(), sender: 'user', role: 'user', text: userText.trim() }
    ];
    setMessages(updatedMessages);

    try {
      const history = updatedMessages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text
      }));

      const terminalText = consoleOutput
        ? consoleOutput.map(line => line.text).join('')
        : '';

      const data = await askAssistant(history, code, language, laboratoryId, terminalText);
      setMessages([
        ...updatedMessages,
        {
          id: Date.now() + 1,
          sender: 'ai',
          role: 'model',
          text: data.reply,
          attempt_id: data.attempt_id || null,
          interaction: data.interaction || null,
          quick_replies: data.quick_replies || null
        }
      ]);
    } catch (err) {
      toast.error('El asistente no pudo responder. Verifica tu conexión.');
      setMessages([
        ...updatedMessages,
        {
          id: Date.now() + 1,
          sender: 'ai',
          role: 'model',
          text: 'En este momento no puedo responder. Inténtalo de nuevo en un momento.'
        }
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const rateMessage = async (msgId, attemptId, value) => {
    if (ratings[msgId]) return;
    try {
      await rateAttempt(attemptId, value);
      const next = { ...ratings, [msgId]: value };
      setRatings(next);
      localStorage.setItem('alda_chat_ratings', JSON.stringify(next));
      toast.success(value === 1 ? 'Marcado como útil ✔' : 'Gracias por tu opinión', { duration: 1500 });
    } catch { toast.error('No se pudo registrar.'); }
  };

  const isLastMessageFromAI = messages.length > 0 && messages[messages.length - 1].sender === 'ai';

  return (
    <div className="w-full h-full bg-[var(--upt-bg)] flex flex-col">
      {/* ─── Header ───────────────────────────────────────── */}
      <div className="h-13 bg-[var(--upt-surface)] border-b border-white/[0.06] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-[var(--upt-surface-light)] border border-white/10 flex items-center justify-center">
            <Bot className="w-3.5 h-3.5 text-[var(--upt-text-secondary)]" />
          </div>
          <div>
            <h2 className="font-semibold text-[var(--upt-text-primary)] text-[13px] leading-tight">Tutor ALDA</h2>
            <p className="text-[10px] text-[var(--upt-text-tertiary)] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
              Método Socrático
            </p>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          {messages.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('¿Seguro que deseas borrar el historial de este chat?')) {
                  setMessages([]);
                }
              }}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--upt-text-tertiary)] hover:text-rose-400 hover:bg-white/[0.04] transition-all cursor-pointer"
              title="Borrar chat"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--upt-text-tertiary)] hover:text-[var(--upt-text-primary)] hover:bg-white/[0.04] transition-all cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ─── Messages ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <div className="w-10 h-10 rounded-xl bg-[var(--upt-surface-light)] border border-[var(--upt-gold)]/15 flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5 text-[var(--upt-gold)]/60" />
            </div>
            <h3 className="font-semibold text-[var(--upt-text-primary)] text-sm mb-1">¿En qué te puedo ayudar?</h3>
            <p className="text-[12px] text-[var(--upt-text-tertiary)] mb-6 leading-relaxed max-w-[240px]">
              Te guiaré con preguntas reflexivas para que encuentres la solución.
            </p>
            <div className="grid grid-cols-2 gap-2 w-full max-w-[300px]">
              {INITIAL_SUGGESTIONS.map((s, i) => {
                const Icon = s.icon;
                return (
                  <button
                    key={i}
                    onClick={() => sendMessage(s.text)}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[var(--upt-surface)] border border-[var(--upt-gold)]/10 text-left text-[11px] text-[var(--upt-text-secondary)] hover:border-[var(--upt-gold)]/25 hover:text-[var(--upt-text-primary)] transition-colors disabled:opacity-50"
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0 text-[var(--upt-gold)]/50" />
                    <span className="leading-tight">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            msg.sender === 'ai' ? (
              <div key={msg.id} className="flex gap-2.5">
                <div className="w-6 h-6 rounded-md bg-[var(--upt-surface-light)] shrink-0 border border-white/10 flex items-center justify-center mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-[var(--upt-text-tertiary)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="bg-[var(--upt-surface)] text-[var(--upt-text-primary)] text-[13px] px-4 py-3 rounded-2xl rounded-tl-sm border border-white/[0.07] leading-relaxed whitespace-pre-wrap">
                    {msg.text}
                  </div>
                  {msg.interaction?.type === 'multiple_choice' && (
                    <InteractiveQuiz interaction={msg.interaction} />
                  )}
                  {msg.interaction?.type === 'fill_in_blank' && (
                    <InteractiveFillBlank interaction={msg.interaction} />
                  )}
                  {msg.attempt_id && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] text-[var(--upt-text-tertiary)]">¿Fue útil?</span>
                      <button
                        onClick={() => rateMessage(msg.id, msg.attempt_id, 1)}
                        disabled={!!ratings[msg.id]}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium transition-all border ${
                          ratings[msg.id] === 1
                            ? 'bg-[var(--upt-gold)]/10 border-[var(--upt-gold)]/30 text-[var(--upt-gold)]'
                            : 'bg-transparent border-white/10 text-white/30 hover:border-[var(--upt-gold)]/30 hover:text-[var(--upt-gold)] cursor-pointer'
                        } disabled:cursor-default`}
                      >
                        <ThumbsUp size={10} /> Sí
                      </button>
                      <button
                        onClick={() => rateMessage(msg.id, msg.attempt_id, -1)}
                        disabled={!!ratings[msg.id]}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium transition-all border ${
                          ratings[msg.id] === -1
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                            : 'bg-transparent border-white/10 text-white/30 hover:border-rose-500/30 hover:text-rose-400 cursor-pointer'
                        } disabled:cursor-default`}
                      >
                        <ThumbsDown size={10} /> No
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div key={msg.id} className="flex justify-end pl-10">
                <div className="bg-[var(--upt-surface-light)] text-[var(--upt-text-primary)] text-[13px] px-4 py-3 rounded-2xl rounded-tr-sm leading-relaxed whitespace-pre-wrap border border-white/[0.08]">
                  {msg.text}
                </div>
              </div>
            )
          ))
        )}

        {/* Typing indicator */}
        {isSubmitting && (
          <div className="flex gap-2.5">
            <div className="w-6 h-6 rounded-md bg-[var(--upt-surface-light)] border border-white/10 shrink-0 flex items-center justify-center mt-0.5">
              <Bot className="w-3.5 h-3.5 text-[var(--upt-text-tertiary)]" />
            </div>
            <div className="bg-[var(--upt-surface)] px-4 py-3 rounded-2xl rounded-tl-sm border border-white/[0.07] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--upt-gold)]/50 animate-bounce [animation-delay:0ms]"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--upt-gold)]/50 animate-bounce [animation-delay:150ms]"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--upt-gold)]/50 animate-bounce [animation-delay:300ms]"></span>
            </div>
          </div>
        )}

        {/* Follow-up suggestions */}
        {!isSubmitting && isLastMessageFromAI && (
          <div className="flex flex-wrap gap-1.5 pl-8 pt-1">
            {(messages[messages.length - 1].quick_replies || FOLLOWUP_SUGGESTIONS).map((text, i) => (
              <button
                key={i}
                onClick={() => sendMessage(text)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--upt-surface)] border border-[var(--upt-gold)]/10 text-[11px] text-[var(--upt-text-tertiary)] hover:border-[var(--upt-gold)]/25 hover:text-[var(--upt-text-primary)] transition-colors"
              >
                <Sparkles className="w-3 h-3 text-[var(--upt-gold)]/40" />
                {text}
              </button>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ─── Input ────────────────────────────────────────── */}
      <div className="p-3 bg-[var(--upt-surface)] border-t border-white/[0.06]">
        <form onSubmit={handleSubmit} className="flex items-end gap-2 relative">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (input.trim()) handleSubmit(e);
              }
            }}
            disabled={isSubmitting}
            className="w-full bg-[var(--upt-bg)] border border-white/[0.08] rounded-lg py-2.5 pl-4 pr-11 text-[13px] text-[var(--upt-text-primary)] placeholder:text-[var(--upt-text-tertiary)] focus:outline-none focus:border-[var(--upt-gold)]/30 transition-colors min-h-[42px] max-h-[100px] resize-none disabled:opacity-50"
            placeholder="Escribe tu pregunta..."
            rows="1"
          />
          <button
            type="submit"
            disabled={isSubmitting || !input.trim()}
            className="absolute right-2 bottom-2 w-7 h-7 flex items-center justify-center bg-[var(--upt-accent)] hover:bg-[var(--upt-accent-light)] disabled:opacity-30 text-white rounded-md transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
        <p className="text-[10px] text-center text-[var(--upt-text-tertiary)] mt-1">Enter para enviar · Shift+Enter nueva línea</p>
      </div>
    </div>
  );
}

