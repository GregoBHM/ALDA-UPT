import { useState, useEffect } from 'react';
import { Play, TrendingUp, Clock, BookOpen, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getDashboard } from '../../api';

export default function Overview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    if (!user?.email) { setLoading(false); return; }

    getDashboard(user.email)
      .then(data => setStats(data))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const goToPractice = () => {
    window.dispatchEvent(new CustomEvent('alda:navigate', { detail: 'practice' }));
  };

  if (loading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <Loader2 size={24} className="text-[var(--upt-text-tertiary)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-y-auto bg-[var(--upt-bg)]">
      <div className="p-6 lg:p-8 max-w-[1100px] mx-auto">

        <div className="mb-8" style={{ animation: 'fade-up 0.4s ease-out' }}>
          <h2 className="text-[22px] font-bold text-[var(--upt-text-primary)] mb-1 tracking-tight">Resumen Académico</h2>
          <p className="text-sm text-[var(--upt-text-tertiary)]">Tu progreso en la plataforma ALDA.</p>
        </div>

        {/* ─── Metrics ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6" style={{ animation: 'fade-up 0.4s ease-out 0.1s both' }}>
          <MetricCard icon={BookOpen}   label="Retos Disponibles"    value={stats?.available_labs ?? '—'} />
          <MetricCard icon={Clock}      label="Horas de Práctica"    value={`${stats?.practice_hours ?? '0'} h`} />
          <MetricCard icon={TrendingUp} label="Ayudas del Asistente" value={stats?.ai_hints_used ?? '0'} />
        </div>

        {/* ─── Latest Lab card ─────────────────────────────── */}
        {stats?.latest_lab && (
          <div
            className="rounded-xl bg-[var(--upt-surface)] border border-white/[0.07] overflow-hidden"
            style={{ animation: 'fade-up 0.4s ease-out 0.15s both' }}
          >
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--upt-text-primary)]">Laboratorio Activo</h3>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-[var(--upt-gold)]/10 text-[var(--upt-gold)] border border-[var(--upt-gold)]/20">
                En Progreso
              </span>
            </div>
            <div className="px-6 py-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg shrink-0 bg-[var(--upt-surface-light)] flex items-center justify-center text-[var(--upt-gold)] font-black text-xs border border-white/[0.06]">
                  {stats.latest_lab.language}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[var(--upt-text-primary)] mb-0.5">{stats.latest_lab.title}</h4>
                  <p className="text-[12px] text-[var(--upt-text-tertiary)]">
                    Dificultad: {stats.latest_lab.difficulty === 'easy' ? 'Fácil' : stats.latest_lab.difficulty === 'hard' ? 'Difícil' : 'Media'}
                  </p>
                </div>
              </div>
              {/* Primary CTA — accent blue, flat */}
              <button
                onClick={goToPractice}
                className="flex items-center gap-2 px-5 py-2 bg-[var(--upt-accent)] hover:bg-[var(--upt-accent-light)] text-white text-sm font-semibold rounded-md transition-colors cursor-pointer"
              >
                <Play size={14} fill="white" /> Ir al Compilador
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value }) {
  return (
    <div className="p-5 rounded-xl bg-[var(--upt-surface)] border border-white/[0.07] flex items-start gap-4 hover:bg-[var(--upt-surface-light)] transition-colors">
      <div className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center bg-white/[0.04] border border-[var(--upt-gold)]/15">
        <Icon size={17} className="text-[var(--upt-gold)]" />
      </div>
      <div>
        <p className="text-[11px] font-medium text-[var(--upt-text-tertiary)] uppercase tracking-wider mb-1">{label}</p>
        <h3 className="text-[26px] font-bold text-[var(--upt-text-primary)] leading-none">{value}</h3>
      </div>
    </div>
  );
}
