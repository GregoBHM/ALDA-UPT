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
        const data = await getProgress(user.email);
        setData(data);
      } catch {
        toast.error('No se pudieron cargar tus avances');
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, []);

  if (loading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[var(--upt-gold)] animate-spin" />
      </div>
    );
  }

  if (!data || data.total_attempts === 0) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center opacity-60 px-8">
        <TrendingUp className="w-12 h-12 text-[var(--upt-text-tertiary)] mb-4" />
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
    <div className="absolute inset-0 overflow-auto">
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        <div className="mb-8" style={{ animation: 'fade-up 0.4s ease-out' }}>
          <h2 className="text-[22px] font-extrabold text-[var(--upt-text-primary)] mb-1 tracking-tight">Mis Avances</h2>
          <p className="text-[var(--upt-text-secondary)] text-sm">Historial de actividad y progreso en la plataforma.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-7">
          <div className="bg-gradient-to-br from-[var(--upt-navy)] to-[var(--upt-navy-light)] text-white rounded-2xl p-6 shadow-lg flex items-center gap-4 border border-white/[0.06]">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
              <Trophy className="w-6 h-6 text-[var(--upt-gold)]" />
            </div>
            <div>
              <p className="text-sm text-white/60">Retos Resueltos</p>
              <p className="text-3xl font-black">{data.solved_count} / {data.total_labs}</p>
            </div>
          </div>

          <div className="bg-[var(--upt-surface)] rounded-2xl p-6 shadow-lg border border-white/[0.06] flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0 border border-blue-500/20">
              <Code2 className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-[var(--upt-text-secondary)]">Ejecuciones</p>
              <p className="text-3xl font-black text-[var(--upt-text-primary)]">{data.total_attempts}</p>
            </div>
          </div>

          <div className="bg-[var(--upt-surface)] rounded-2xl p-6 shadow-lg border border-white/[0.06] flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-[var(--upt-text-secondary)]">Independiente</p>
              <p className="text-3xl font-black text-[var(--upt-text-primary)]">{data.independent_attempts}</p>
            </div>
          </div>

          <div className="bg-[var(--upt-surface)] rounded-2xl p-6 shadow-lg border border-white/[0.06] flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0 border border-amber-500/20">
              <Bot className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-[var(--upt-text-secondary)]">Con Asistente</p>
              <p className="text-3xl font-black text-[var(--upt-text-primary)]">{data.attempts_with_ai}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          <div className="bg-[var(--upt-surface)] rounded-2xl border border-white/[0.06] shadow-lg p-6">
            <h3 className="font-bold text-[var(--upt-text-primary)] mb-4 text-sm">Progreso de Laboratorios</h3>
            <div className="flex rounded-full overflow-hidden h-4 w-full shadow-inner bg-white/8 mb-3">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000" 
                style={{ width: `${(data.solved_count / data.total_labs) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-[var(--upt-text-tertiary)]">
              Has resuelto el <span className="text-emerald-400 font-bold">{Math.round((data.solved_count / data.total_labs) * 100)}%</span> de los retos disponibles.
            </p>
          </div>

          <div className="bg-[var(--upt-surface)] rounded-2xl border border-white/[0.06] shadow-lg p-6">
            <h3 className="font-bold text-[var(--upt-text-primary)] mb-4 text-sm">Nivel de autonomía</h3>
            <div className="flex rounded-full overflow-hidden h-4 w-full shadow-inner bg-white/8 mb-3">
              <div className="bg-[var(--upt-navy-light)] transition-all" style={{ width: `${independentPct}%` }}></div>
              <div className="bg-[var(--upt-gold)] transition-all" style={{ width: `${aiPct}%` }}></div>
            </div>
            <div className="flex justify-between text-[10px] text-[var(--upt-text-tertiary)] uppercase font-bold tracking-wider">
              <span>Independiente ({independentPct}%)</span>
              <span>Con Asistente ({aiPct}%)</span>
            </div>
          </div>
        </div>

        {data.recent_activity.length > 0 && (
          <div className="bg-[var(--upt-surface)] rounded-2xl border border-white/[0.06] shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between">
              <h3 className="font-bold text-[var(--upt-text-primary)] text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[var(--upt-text-tertiary)]" />
                Historial de Intentos
              </h3>
            </div>
            <div className="divide-y divide-white/5">
                {data.recent_activity.map(a => (
                <div key={a.id} className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-4 hover:bg-white/[0.02] transition-colors gap-2 sm:gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      a.is_passed ? 'bg-green-500/10 border-green-500/20 text-green-400' : 
                      a.is_failed ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                      'bg-blue-500/10 border-blue-500/20 text-blue-400'
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
                        <span className="text-[10px] font-bold px-2 py-1 bg-green-500/20 text-green-400 rounded-lg border border-green-500/30">RESUELTO ✅</span>
                      ) : a.is_failed ? (
                        <span className="text-[10px] font-bold px-2 py-1 bg-red-500/20 text-red-400 rounded-lg border border-red-500/30">FALLIDO ❌</span>
                      ) : a.had_ai_help ? (
                        <span className="text-[10px] font-bold px-2 py-1 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">CON ASISTENTE 🤖</span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-1 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30">PRÁCTICA LIBRE</span>
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
