import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, Sparkles, Loader2, X, Trash2, ThumbsUp, ThumbsDown, Lightbulb, Bug, HelpCircle, Repeat, Volume2, VolumeX } from 'lucide-react';
import { askAssistantStream, rateAttempt } from '../../api';
import toast from 'react-hot-toast';
import InteractiveQuiz from './InteractiveQuiz';
import InteractiveFillBlank from './InteractiveFillBlank';
import InteractiveCodeTrace from './InteractiveCodeTrace';
import InteractiveTrueFalse from './InteractiveTrueFalse';
import InteractiveOrderSteps from './InteractiveOrderSteps';
import MarkdownText from './MarkdownText';

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

const STREAMING_MSG_ID = '__streaming__';

export default function SocraticPanel({ messages, setMessages, onClose, code, language, laboratoryId, consoleOutput, isPasted, onResetPaste }) {
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [ratings, setRatings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('alda_chat_ratings') || '{}'); }
    catch { return {}; }
  });
  const bottomRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText, isSubmitting]);

  const speak = useCallback((text) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/[*_`#>\[\]()]/g, '').trim();
    const utter = new SpeechSynthesisUtterance(clean);
    utter.lang = 'es-ES';
    utter.rate = 1.05;
    window.speechSynthesis.speak(utter);
  }, [voiceEnabled]);

  const sendMessage = async (userText) => {
    if (isSubmitting || !userText.trim()) return;
    setInput('');
    setIsSubmitting(true);
    setStreamingText('');

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

      const terminalText = (consoleOutput ?? []).map(line => line.text).join('');

      await askAssistantStream(
        history, code, language, laboratoryId, terminalText, isPasted,
        (chunk, accumulated) => {
          // Ocultar las etiquetas XML mientras se hace streaming
          const visibleText = accumulated
            .replace(/<interaction>[\s\S]*?(<\/interaction>)?/gi, '')
            .replace(/<quick_replies>[\s\S]*?(<\/quick_replies>)?/gi, '')
            .trim();
          setStreamingText(visibleText);
        },
        (fullText) => {
          if (isPasted && onResetPaste) onResetPaste();
          setStreamingText('');

          // Extraer la interacción
          let interaction = null;
          const interactionMatch = fullText.match(/<interaction>([\s\S]*?)<\/interaction>/i);
          if (interactionMatch) {
            try { interaction = JSON.parse(interactionMatch[1].trim()); } catch (e) { console.error('Error parsing interaction', e); }
          }

          // Extraer respuestas rápidas
          let quick_replies = null;
          const qrMatch = fullText.match(/<quick_replies>([\s\S]*?)<\/quick_replies>/i);
          if (qrMatch) {
            try { quick_replies = JSON.parse(qrMatch[1].trim()); } catch (e) { console.error('Error parsing quick replies', e); }
          }

          // Texto limpio
          const cleanText = fullText
            .replace(/<interaction>[\s\S]*?<\/interaction>/ig, '')
            .replace(/<quick_replies>[\s\S]*?<\/quick_replies>/ig, '')
            .trim();

          setMessages([
            ...updatedMessages,
            {
              id: Date.now() + 1,
              sender: 'ai',
              role: 'model',
              text: cleanText,
              attempt_id: null,
              interaction: interaction,
              quick_replies: quick_replies,
            }
          ]);
          speak(cleanText);
        }
      );
    } catch (err) {
      setStreamingText('');
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
    if (ratings[msgId] || !attemptId) return;
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
    <div className="w-full h-full bg-[var(--upt-bg)] flex flex-col border-l border-[var(--upt-surface-border)]">
      <div className="h-14 bg-[var(--upt-surface)] border-b border-[var(--upt-surface-border)] flex items-center justify-between px-4 shrink-0 shadow-[var(--upt-shadow-sm)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[var(--upt-surface-light)] border border-[var(--upt-surface-border)] flex items-center justify-center">
            <Bot className="w-4 h-4 text-[var(--upt-text-secondary)]" />
          </div>
          <div>
            <h2 className="font-bold text-[var(--upt-text-primary)] text-[13px] leading-tight">Tutor ALDA</h2>
            <p className="text-[11px] text-[var(--upt-text-tertiary)] flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--upt-success)] inline-block shadow-[0_0_8px_var(--upt-success)]"></span>
              {isSubmitting ? 'Escribiendo...' : 'Método Socrático'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              const next = !voiceEnabled;
              setVoiceEnabled(next);
              if (!next) window.speechSynthesis?.cancel();
            }}
            title={voiceEnabled ? 'Silenciar voz de ALDA' : 'Activar voz de ALDA'}
            className={`w-8 h-8 flex items-center justify-center rounded-xl border-none transition-all cursor-pointer ${voiceEnabled ? 'text-[var(--upt-gold)] bg-[var(--upt-gold)]/10' : 'text-[var(--upt-text-tertiary)] bg-transparent hover:text-[var(--upt-gold)] hover:bg-[var(--upt-gold)]/10'}`}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          {messages.length > 0 && (
            <button
              onClick={() => { if (window.confirm('¿Seguro que deseas borrar el historial de este chat?')) setMessages([]); }}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-transparent border-none text-[var(--upt-text-tertiary)] hover:text-[var(--upt-error)] hover:bg-[var(--upt-error)]/10 transition-all cursor-pointer"
              title="Borrar chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-transparent border-none text-[var(--upt-text-tertiary)] hover:text-[var(--upt-text-primary)] hover:bg-[var(--upt-surface-light)] transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
        {messages.length === 0 && !streamingText ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <div className="w-12 h-12 rounded-2xl bg-[var(--upt-surface-light)] border border-[var(--upt-gold)]/30 flex items-center justify-center mb-4 shadow-[var(--upt-shadow-sm)]">
              <Sparkles className="w-6 h-6 text-[var(--upt-gold)]" />
            </div>
            <h3 className="font-bold text-[var(--upt-text-primary)] text-sm mb-1">¿En qué te puedo ayudar?</h3>
            <p className="text-[12px] text-[var(--upt-text-secondary)] mb-6 leading-relaxed max-w-[240px]">
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
                    className="flex items-center gap-2 px-3 py-3 rounded-xl bg-[var(--upt-surface)] border border-[var(--upt-surface-border)] text-left text-[11px] font-bold text-[var(--upt-text-secondary)] hover:border-[var(--upt-gold)]/40 hover:text-[var(--upt-text-primary)] hover:bg-[var(--upt-surface-light)] transition-colors disabled:opacity-50 cursor-pointer shadow-[var(--upt-shadow-sm)]"
                  >
                    <Icon className="w-4 h-4 shrink-0 text-[var(--upt-gold)] opacity-90" />
                    <span className="leading-tight">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              msg.sender === 'ai' ? (
                <div key={msg.id} className="flex gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[var(--upt-surface-light)] shrink-0 border border-[var(--upt-surface-border)] flex items-center justify-center mt-0.5 shadow-[var(--upt-shadow-sm)]">
                    <Bot className="w-4 h-4 text-[var(--upt-text-secondary)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="bg-[var(--upt-surface)] text-[var(--upt-text-primary)] text-[13px] px-4 py-3 rounded-2xl rounded-tl-sm border border-[var(--upt-surface-border)] leading-relaxed shadow-[var(--upt-shadow-sm)]">
                      <MarkdownText text={msg.text} />
                    </div>
                    {msg.interaction?.type === 'multiple_choice' && <InteractiveQuiz interaction={msg.interaction} />}
                    {msg.interaction?.type === 'fill_in_blank' && <InteractiveFillBlank interaction={msg.interaction} />}
                    {msg.interaction?.type === 'code_trace' && <InteractiveCodeTrace interaction={msg.interaction} />}
                    {msg.interaction?.type === 'true_false' && <InteractiveTrueFalse interaction={msg.interaction} />}
                    {msg.interaction?.type === 'order_steps' && <InteractiveOrderSteps interaction={msg.interaction} />}
                    {msg.attempt_id && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[11px] font-medium text-[var(--upt-text-tertiary)]">¿Fue útil?</span>
                        <button
                          onClick={() => rateMessage(msg.id, msg.attempt_id, 1)}
                          disabled={!!ratings[msg.id]}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border shadow-[var(--upt-shadow-sm)] ${ratings[msg.id] === 1 ? 'bg-[var(--upt-gold)]/10 border-[var(--upt-gold)]/40 text-[var(--upt-gold)]' : 'bg-[var(--upt-surface)] border-[var(--upt-surface-border)] text-[var(--upt-text-secondary)] hover:border-[var(--upt-gold)]/40 hover:text-[var(--upt-gold)] hover:bg-[var(--upt-surface-light)] cursor-pointer'} disabled:cursor-default`}
                        >
                          <ThumbsUp size={12} /> Sí
                        </button>
                        <button
                          onClick={() => rateMessage(msg.id, msg.attempt_id, -1)}
                          disabled={!!ratings[msg.id]}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border shadow-[var(--upt-shadow-sm)] ${ratings[msg.id] === -1 ? 'bg-[var(--upt-error)]/10 border-[var(--upt-error)]/40 text-[var(--upt-error)]' : 'bg-[var(--upt-surface)] border-[var(--upt-surface-border)] text-[var(--upt-text-secondary)] hover:border-[var(--upt-error)]/40 hover:text-[var(--upt-error)] hover:bg-[var(--upt-surface-light)] cursor-pointer'} disabled:cursor-default`}
                        >
                          <ThumbsDown size={12} /> No
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div key={msg.id} className="flex justify-end pl-10">
                  <div className="bg-[var(--upt-surface-light)] text-[var(--upt-text-primary)] text-[13px] px-4 py-3 rounded-2xl rounded-tr-sm leading-relaxed whitespace-pre-wrap border border-[var(--upt-surface-border)] shadow-[var(--upt-shadow-sm)]">
                    {msg.text}
                  </div>
                </div>
              )
            ))}

            {streamingText && (
              <div className="flex gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[var(--upt-surface-light)] shrink-0 border border-[var(--upt-surface-border)] flex items-center justify-center mt-0.5 shadow-[var(--upt-shadow-sm)]">
                  <Bot className="w-4 h-4 text-[var(--upt-gold)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="bg-[var(--upt-surface)] text-[var(--upt-text-primary)] text-[13px] px-4 py-3 rounded-2xl rounded-tl-sm border border-[var(--upt-gold)]/20 leading-relaxed shadow-[var(--upt-shadow-sm)]">
                    <MarkdownText text={streamingText} />
                    <span className="inline-block w-1.5 h-4 bg-[var(--upt-gold)] rounded-sm ml-0.5 animate-pulse" />
                  </div>
                </div>
              </div>
            )}

            {isSubmitting && !streamingText && (
              <div className="flex gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[var(--upt-surface-light)] border border-[var(--upt-surface-border)] shrink-0 flex items-center justify-center mt-0.5 shadow-[var(--upt-shadow-sm)]">
                  <Bot className="w-4 h-4 text-[var(--upt-text-secondary)]" />
                </div>
                <div className="bg-[var(--upt-surface)] px-4 py-3 h-11 rounded-2xl rounded-tl-sm border border-[var(--upt-surface-border)] flex items-center gap-1.5 shadow-[var(--upt-shadow-sm)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--upt-gold)] animate-bounce [animation-delay:0ms]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--upt-gold)] animate-bounce [animation-delay:150ms]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--upt-gold)] animate-bounce [animation-delay:300ms]"></span>
                </div>
              </div>
            )}

            {!isSubmitting && !streamingText && isLastMessageFromAI && (
              <div className="flex flex-wrap gap-2 pl-10 pt-1">
                {(messages[messages.length - 1].quick_replies || FOLLOWUP_SUGGESTIONS).map((text, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(text)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--upt-surface)] border border-[var(--upt-surface-border)] text-[11px] font-bold text-[var(--upt-text-secondary)] hover:border-[var(--upt-gold)]/30 hover:text-[var(--upt-text-primary)] hover:bg-[var(--upt-surface-light)] transition-colors cursor-pointer shadow-[var(--upt-shadow-sm)]"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[var(--upt-gold)] opacity-80" />
                    {text}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="p-3 bg-[var(--upt-surface)] border-t border-[var(--upt-surface-border)] shadow-[var(--upt-shadow-sm)]">
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
            className="w-full bg-[var(--upt-bg)] border border-[var(--upt-surface-border)] rounded-xl py-3 pl-4 pr-12 text-[13px] text-[var(--upt-text-primary)] placeholder:text-[var(--upt-text-tertiary)] focus:outline-none focus:border-[var(--upt-gold)]/40 transition-colors min-h-[44px] max-h-[120px] resize-none disabled:opacity-50 shadow-inner"
            placeholder="Escribe tu pregunta..."
            rows="1"
          />
          <button
            type="submit"
            disabled={isSubmitting || !input.trim()}
            className="absolute right-2 bottom-2.5 w-8 h-8 flex items-center justify-center bg-[var(--upt-accent)] hover:bg-[var(--upt-accent-light)] disabled:opacity-50 disabled:bg-[var(--upt-surface-border)] text-white rounded-lg transition-colors cursor-pointer shadow-[var(--upt-shadow-sm)]"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-[10px] font-medium text-center text-[var(--upt-text-tertiary)] mt-2">Enter para enviar · Shift+Enter nueva línea</p>
      </div>
    </div>
  );
}
