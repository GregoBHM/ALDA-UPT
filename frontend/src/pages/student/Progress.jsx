import { useState, useEffect } from 'react';
import { TrendingUp, CheckCircle, Bot, Code2, Loader2, Calendar, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';
import { getProgress } from '../../api';

export default function Progress() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user?.email) return;
        const result = await getProgress(user.email);
        setData(result);
      } catch {
        toast.error('No se pudieron cargar tus avances');
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
    const id = setInterval(fetchProgress, 30000);
    return () => clearInterval(id);
  }, []);

  if (loading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[var(--upt-accent)] animate-spin" />
      </div>
    );
  }

  if (!data || data.total_attempts === 0) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
        <TrendingUp className="w-12 h-12 text-[var(--upt-text-tertiary)] mb-4 opacity-70" />
        <h3 className="font-bold text-[var(--upt-text-primary)] text-lg">Sin actividad registrada aún</h3>
        <p className="text-sm text-[var(--upt-text-secondary)] mt-1">Entra a la Sala de Práctica, escribe y ejecuta código para ver tu progreso aquí.</p>
      </div>
    );
  }

  const independentPct = data.total_attempts > 0
    ? Math.round((data.independent_attempts / data.total_attempts) * 100)
    : 0;
  const aiPct = 100 - independentPct;

  return (
    <div className="absolute inset-0 overflow-auto bg-[var(--upt-bg)]">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="mb-8" style={{ animation: 'fade-up 0.4s ease-out' }}>
          <h2 className="text-[22px] font-extrabold text-[var(--upt-text-primary)] mb-1 tracking-tight">Mis Avances</h2>
          <p className="text-[var(--upt-text-secondary)] text-sm">Historial de actividad y progreso en la plataforma.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-7">
          <div className="group bg-[var(--upt-surface)] rounded-2xl p-6 shadow-[var(--upt-shadow-sm)] flex items-center gap-4 border border-[var(--upt-surface-border)] hover:border-[var(--upt-warning)]/25 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all duration-200">
            <div className="w-12 h-12 rounded-xl bg-[var(--upt-warning)]/10 flex items-center justify-center shrink-0 border border-[var(--upt-warning)]/20 group-hover:bg-[var(--upt-warning)]/15 transition-colors">
              <Trophy className="w-6 h-6 text-[var(--upt-warning)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--upt-text-secondary)]">Retos Resueltos</p>
              <p className="text-3xl font-black text-[var(--upt-text-primary)] tabular-nums">{data.solved_count} / {data.total_labs}</p>
            </div>
          </div>

          <div className="group bg-[var(--upt-surface)] rounded-2xl p-6 shadow-[var(--upt-shadow-sm)] border border-[var(--upt-surface-border)] flex items-center gap-4 hover:border-[var(--upt-info)]/25 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all duration-200">
            <div className="w-12 h-12 rounded-xl bg-[var(--upt-info)]/10 flex items-center justify-center shrink-0 border border-[var(--upt-info)]/20 group-hover:bg-[var(--upt-info)]/15 transition-colors">
              <Code2 className="w-6 h-6 text-[var(--upt-info)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--upt-text-secondary)]">Ejecuciones</p>
              <p className="text-3xl font-black text-[var(--upt-text-primary)] tabular-nums">{data.total_attempts}</p>
            </div>
          </div>

          <div className="group bg-[var(--upt-surface)] rounded-2xl p-6 shadow-[var(--upt-shadow-sm)] border border-[var(--upt-surface-border)] flex items-center gap-4 hover:border-[var(--upt-success)]/25 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all duration-200">
            <div className="w-12 h-12 rounded-xl bg-[var(--upt-success)]/10 flex items-center justify-center shrink-0 border border-[var(--upt-success)]/20 group-hover:bg-[var(--upt-success)]/15 transition-colors">
              <CheckCircle className="w-6 h-6 text-[var(--upt-success)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--upt-text-secondary)]">Independiente</p>
              <p className="text-3xl font-black text-[var(--upt-text-primary)] tabular-nums">{data.independent_attempts}</p>
            </div>
          </div>

          <div className="group bg-[var(--upt-surface)] rounded-2xl p-6 shadow-[var(--upt-shadow-sm)] border border-[var(--upt-surface-border)] flex items-center gap-4 hover:border-[var(--upt-warning)]/25 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all duration-200">
            <div className="w-12 h-12 rounded-xl bg-[var(--upt-warning)]/10 flex items-center justify-center shrink-0 border border-[var(--upt-warning)]/20 group-hover:bg-[var(--upt-warning)]/15 transition-colors">
              <Bot className="w-6 h-6 text-[var(--upt-warning)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--upt-text-secondary)]">Con Asistente</p>
              <p className="text-3xl font-black text-[var(--upt-text-primary)] tabular-nums">{data.attempts_with_ai}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          <div className="bg-[var(--upt-surface)] rounded-2xl border border-[var(--upt-surface-border)] shadow-[var(--upt-shadow-sm)] p-6">
            <h3 className="font-bold text-[var(--upt-text-primary)] mb-1 text-sm">Progreso de Laboratorios</h3>
            <p className="text-xs text-[var(--upt-text-tertiary)] mb-4">
              Has resuelto el <span className="text-[var(--upt-success)] font-bold">{Math.round((data.solved_count / data.total_labs) * 100)}%</span> de los retos disponibles.
            </p>
            <div className="relative flex rounded-full overflow-hidden h-3 w-full bg-[var(--upt-surface-border)]">
              <div
                className="transition-all duration-1000 rounded-full"
                style={{
                  width: `${(data.solved_count / data.total_labs) * 100}%`,
                  background: 'linear-gradient(90deg, var(--upt-success), #34d399)'
                }}
              />
            </div>
          </div>

          <div className="bg-[var(--upt-surface)] rounded-2xl border border-[var(--upt-surface-border)] shadow-[var(--upt-shadow-sm)] p-6">
            <h3 className="font-bold text-[var(--upt-text-primary)] mb-1 text-sm">Nivel de autonomía</h3>
            <p className="text-xs text-[var(--upt-text-tertiary)] mb-4">
              <span className="text-[var(--upt-accent)] font-bold">{independentPct}%</span> sin asistente · <span className="text-[var(--upt-gold)] font-bold">{aiPct}%</span> con asistente.
            </p>
            <div className="flex rounded-full overflow-hidden h-3 w-full bg-[var(--upt-surface-border)]">
              <div
                className="transition-all duration-700"
                style={{ width: `${independentPct}%`, background: 'linear-gradient(90deg, var(--upt-accent), #818cf8)' }}
              />
              <div
                className="transition-all duration-700"
                style={{ width: `${aiPct}%`, background: 'linear-gradient(90deg, var(--upt-gold), #fbbf24)' }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-[var(--upt-text-tertiary)] uppercase font-bold tracking-wider mt-2">
              <span>Independiente</span>
              <span>Con Asistente</span>
            </div>
          </div>
        </div>

        {data.recent_activity.length > 0 && (
          <div className="bg-[var(--upt-surface)] rounded-2xl border border-[var(--upt-surface-border)] shadow-[var(--upt-shadow-sm)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--upt-surface-border)] bg-[var(--upt-surface-light)] flex items-center justify-between">
              <h3 className="font-bold text-[var(--upt-text-primary)] text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[var(--upt-text-secondary)]" />
                Historial de Intentos
              </h3>
            </div>
            <div className="divide-y divide-[var(--upt-surface-border)]">
              {data.recent_activity.map(a => (
                <div
                  key={a.id}
                  className="relative flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-4 hover:bg-[var(--upt-surface-light)] transition-colors gap-2 sm:gap-4 pl-5"
                >
                  <div className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full ${
                    a.is_passed ? 'bg-[var(--upt-success)]' :
                    a.is_failed ? 'bg-[var(--upt-error)]' :
                    a.had_ai_help ? 'bg-[var(--upt-warning)]' :
                    'bg-[var(--upt-accent)]'
                  }`} />
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      a.is_passed ? 'bg-[var(--upt-success)]/10 border-[var(--upt-success)]/20 text-[var(--upt-success)]' : 
                      a.is_failed ? 'bg-[var(--upt-error)]/10 border-[var(--upt-error)]/20 text-[var(--upt-error)]' :
                      'bg-[var(--upt-accent)]/10 border-[var(--upt-accent)]/20 text-[var(--upt-accent)]'
                    }`}>
                      {a.is_passed ? <Trophy className="w-5 h-5" /> : <Code2 className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[var(--upt-text-primary)]">{a.lab_title}</p>
                      <p className="text-[10px] text-[var(--upt-text-tertiary)] uppercase tracking-widest mt-0.5">Intento #{a.attempt_number}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="text-right sm:text-right">
                      {a.is_passed ? (
                        <span className="text-[10px] font-bold px-2 py-1 bg-[var(--upt-success)]/10 text-[var(--upt-success)] rounded-lg border border-[var(--upt-success)]/20">RESUELTO ✅</span>
                      ) : a.is_failed ? (
                        <span className="text-[10px] font-bold px-2 py-1 bg-[var(--upt-error)]/10 text-[var(--upt-error)] rounded-lg border border-[var(--upt-error)]/20">FALLIDO ❌</span>
                      ) : a.had_ai_help ? (
                        <span className="text-[10px] font-bold px-2 py-1 bg-[var(--upt-warning)]/10 text-[var(--upt-warning)] rounded-lg border border-[var(--upt-warning)]/20">CON ASISTENTE 🤖</span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-1 bg-[var(--upt-accent)]/10 text-[var(--upt-accent)] rounded-lg border border-[var(--upt-accent)]/20">PRÁCTICA LIBRE</span>
                      )}
                      <p className="text-[10px] text-[var(--upt-text-tertiary)] mt-1">
                        {a.date ? new Date(a.date).toLocaleDateString('es-PE') : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
