import { useState, useEffect } from 'react';
import { Play, TrendingUp, Clock, BookOpen, Loader2, Code2, Zap, Terminal } from 'lucide-react';
import toast from 'react-hot-toast';
import { getDashboard } from '../../api';

// Same key resolver as PracticeRoom so auto-selection works correctly
function getUserLabKey() {
  try {
    const u = JSON.parse(sessionStorage.getItem('user') || '{}');
    const uid = u.id || 'guest';
    return `alda_lab_${uid}`;
  } catch {
    return 'alda_active_lab';
  }
}

const LANG_ICON = {
  cpp: { label: 'C++', color: '#00b4d8' },
  python: { label: 'PY', color: '#f4c430' },
  java: { label: 'JAVA', color: '#f89820' },
  javascript: { label: 'JS', color: '#f7df1e' },
};

export default function Overview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    if (!user?.email) { setLoading(false); return; }

    const load = (initial = false) => {
      getDashboard(user.email)
        .then(data => setStats(data))
        .catch(() => null)
        .finally(() => { if (initial) setLoading(false); });
    };

    load(true);
    const interval = setInterval(() => load(false), 15000);
    return () => clearInterval(interval);
  }, []);

  const goToPractice = () => {
    if (stats?.latest_lab?.id) {
      // Save under user-scoped key so PracticeRoom auto-selects the lab
      const key = getUserLabKey();
      localStorage.setItem(key, stats.latest_lab.id);
      // Also keep the legacy key for compatibility
      localStorage.setItem('alda_active_lab', stats.latest_lab.id);
      sessionStorage.setItem('alda_active_lab', stats.latest_lab.id);
    }
    window.dispatchEvent(new CustomEvent('alda:navigate', { detail: 'practice' }));
  };

  if (loading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <Loader2 size={24} className="text-[var(--upt-accent)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-y-auto bg-[var(--upt-bg)]">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

        <div className="mb-8" style={{ animation: 'fade-up 0.4s ease-out' }}>
          <h2 className="text-[22px] font-bold text-[var(--upt-text-primary)] mb-1 tracking-tight">Resumen Académico</h2>
          <p className="text-sm text-[var(--upt-text-secondary)]">Tu progreso en la plataforma ALDA.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6" style={{ animation: 'fade-up 0.4s ease-out 0.1s both' }}>
          <MetricCard icon={BookOpen}   label="Retos Disponibles"    value={stats?.available_labs ?? '—'} />
          <MetricCard icon={Clock}      label="Horas de Práctica"    value={`${stats?.practice_hours ?? '0'} h`} />
          <MetricCard icon={TrendingUp} label="Ayudas del Asistente" value={stats?.ai_hints_used ?? '0'} />
        </div>

        {stats?.latest_lab && (
          <div
            className="rounded-2xl overflow-hidden border border-[var(--upt-accent)]/20 shadow-[0_0_24px_rgba(59,130,246,0.08)]"
            style={{ animation: 'fade-up 0.4s ease-out 0.15s both', background: 'linear-gradient(135deg, var(--upt-surface) 60%, rgba(59,130,246,0.04) 100%)' }}
          >
            {/* Header */}
            <div className="px-6 py-3.5 border-b border-[var(--upt-surface-border)] flex items-center justify-between bg-[var(--upt-surface-light)]/40">
              <div className="flex items-center gap-2">
                <Zap size={13} className="text-[var(--upt-gold)]" />
                <h3 className="text-[12px] font-bold text-[var(--upt-text-primary)] uppercase tracking-widest">Laboratorio Activo</h3>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[var(--upt-gold)]/10 text-[var(--upt-gold)] border border-[var(--upt-gold)]/25 uppercase tracking-wider">
                En Progreso
              </span>
            </div>

            {/* Body */}
            <div className="px-6 py-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Dynamic language icon — replaces the empty/ugly box */}
                <div
                  className="w-14 h-14 rounded-xl shrink-0 flex flex-col items-center justify-center gap-0.5 border shadow-md"
                  style={{
                    background: `linear-gradient(135deg, ${(LANG_ICON[stats.latest_lab.language]?.color || '#6366f1') }22, ${(LANG_ICON[stats.latest_lab.language]?.color || '#6366f1')}11)`,
                    borderColor: `${(LANG_ICON[stats.latest_lab.language]?.color || '#6366f1')}33`,
                  }}
                >
                  {LANG_ICON[stats.latest_lab.language] ? (
                    <span
                      className="font-black text-[11px] leading-none"
                      style={{ color: LANG_ICON[stats.latest_lab.language].color }}
                    >
                      {LANG_ICON[stats.latest_lab.language].label}
                    </span>
                  ) : (
                    <Terminal size={20} className="text-[var(--upt-accent)]" />
                  )}
                  <Code2 size={10} style={{ color: (LANG_ICON[stats.latest_lab.language]?.color || 'var(--upt-accent)'), opacity: 0.6 }} />
                </div>

                <div>
                  <h4 className="text-[15px] font-bold text-[var(--upt-text-primary)] mb-0.5 leading-tight">{stats.latest_lab.title}</h4>
                  <p className="text-[12px] text-[var(--upt-text-secondary)] flex items-center gap-1.5">
                    <span
                      className={`inline-block w-1.5 h-1.5 rounded-full ${
                        stats.latest_lab.difficulty === 'easy' ? 'bg-[var(--upt-success)]' :
                        stats.latest_lab.difficulty === 'hard' ? 'bg-[var(--upt-error)]' :
                        'bg-[var(--upt-warning)]'
                      }`}
                    />
                    {stats.latest_lab.difficulty === 'easy' ? 'Nivel Fácil' : stats.latest_lab.difficulty === 'hard' ? 'Nivel Difícil' : 'Nivel Medio'}
                  </p>
                </div>
              </div>

              <button
                onClick={goToPractice}
                className="flex items-center justify-center gap-2 px-6 min-h-[44px] text-white text-sm font-bold rounded-xl transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(59,130,246,0.4)] active:scale-95"
                style={{ background: 'linear-gradient(135deg, var(--upt-accent), var(--upt-accent-light, #60a5fa))' }}
              >
                <Play size={14} fill="white" strokeWidth={0} /> Ir al Compilador
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
    <div className="group p-5 rounded-2xl bg-[var(--upt-surface)] border border-[var(--upt-surface-border)] flex items-start gap-4 hover:bg-[var(--upt-surface-light)] hover:border-[var(--upt-accent)]/20 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all duration-200 cursor-default">
      <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center bg-[var(--upt-bg)] border border-[var(--upt-surface-border)] group-hover:border-[var(--upt-gold)]/30 group-hover:bg-[var(--upt-gold)]/5 transition-all duration-200">
        <Icon size={18} className="text-[var(--upt-gold)] opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-200" />
      </div>
      <div>
        <p className="text-[11px] font-bold text-[var(--upt-text-tertiary)] uppercase tracking-widest mb-1">{label}</p>
        <h3 className="text-[28px] font-black text-[var(--upt-text-primary)] leading-none tabular-nums">{value}</h3>
      </div>
    </div>
  );
}
