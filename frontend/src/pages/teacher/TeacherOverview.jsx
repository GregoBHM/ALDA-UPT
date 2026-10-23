import { useState, useEffect } from 'react';
import { Users, FlaskConical, Brain, TrendingUp, ArrowUpRight, Clock } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function TeacherOverview() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');

  const fetchStats = async (isPolling = false) => {
    try {
      const res = await fetch(`${API_BASE}/api/teacher/stats`, {
        credentials: 'include',
        headers: { 'X-User-ID': currentUser.id },
        signal: AbortSignal.timeout(8000)
      });
      if (res.ok) setStats(await res.json());
      else if (!isPolling) setStats({ total_students: 0, total_courses: 0, total_labs: 0, total_attempts: 0, total_with_ai: 0, independence_rate: 0, recent_students: [] });
    } catch {
      if (!isPolling) setStats({ total_students: 0, total_courses: 0, total_labs: 0, total_attempts: 0, total_with_ai: 0, independence_rate: 0, recent_students: [] });
    } finally {
      if (!isPolling) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(() => fetchStats(true), 15000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (ts) => {
    if (!ts) return 'N/A';
    const d = new Date(ts);
    const now = new Date();
    const diff = now - d;
    if (diff < 3600000) return `Hace ${Math.floor(diff/60000)} min`;
    if (diff < 86400000) return `Hace ${Math.floor(diff/3600000)}h`;
    return d.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 h-full animate-pulse">
        <div className="h-7 w-56 bg-[var(--upt-surface-light)] rounded mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-28 bg-[var(--upt-surface-light)] rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 overflow-y-auto h-full">
      <div className="mb-8" style={{ animation: 'fade-up 0.4s ease-out' }}>
        <h1 className="text-[22px] font-bold text-[var(--upt-text-primary)] tracking-tight">Panel Docente</h1>
        <p className="text-[var(--upt-text-tertiary)] text-sm mt-1">
          Bienvenido, {currentUser.name}. Analítica académica de la EPIS.
        </p>
      </div>

      {/* ─── Metrics ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8" style={{ animation: 'fade-up 0.4s ease-out 0.05s both' }}>
        <MetricCard icon={Users}       label="Estudiantes"    value={stats.total_students} />
        <MetricCard icon={FlaskConical} label="Laboratorios"  value={stats.total_labs} />
        <MetricCard icon={TrendingUp}  label="Tasa Autonomía" value={`${stats.independence_rate}%`} />
      </div>

      {/* ─── Analytics panels ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8" style={{ animation: 'fade-up 0.4s ease-out 0.1s both' }}>
        {/* AI Activity */}
        <div className="p-5 rounded-xl bg-[var(--upt-surface)] border border-[var(--upt-surface-border)]">
          <h2 className="text-[14px] font-semibold text-[var(--upt-text-primary)] mb-4 flex items-center gap-2">
            <Brain className="w-4 h-4 text-[var(--upt-gold)]" />
            Actividad del Asistente IA
          </h2>
          <div className="space-y-2.5">
            <StatRow label="Total de Intentos"       value={stats.total_attempts} />
            <StatRow label="Consultas con IA"        value={stats.total_with_ai} highlight />
            <StatRow label="Intentos Independientes" value={stats.total_attempts - stats.total_with_ai} />
            <div className="pt-2">
              <div className="flex justify-between text-[11px] font-semibold text-[var(--upt-text-tertiary)] mb-2">
                <span>Autonomía Estudiantil</span>
                <span>{stats.independence_rate}%</span>
              </div>
              <div className="h-1.5 bg-[var(--upt-surface-light)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--upt-gold)] transition-all duration-1000"
                  style={{ width: `${stats.independence_rate}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Recent students */}
        <div className="p-5 rounded-xl bg-[var(--upt-surface)] border border-[var(--upt-surface-border)]">
          <h2 className="text-[14px] font-semibold text-[var(--upt-text-primary)] mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--upt-text-tertiary)]" />
            Actividad Reciente de Alumnos
          </h2>
          {stats.recent_students.length === 0 ? (
            <div className="py-8 text-center text-[var(--upt-text-tertiary)]">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm font-medium">Sin actividad reciente</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.recent_students.map((s, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 px-3 bg-[var(--upt-bg-deep)] rounded-lg hover:bg-[var(--upt-surface-light)] transition-colors border border-[var(--upt-surface-border)]">
                  <div className="w-7 h-7 rounded-md bg-[var(--upt-surface-light)] text-[var(--upt-text-secondary)] flex items-center justify-center font-bold text-xs shrink-0 border border-[var(--upt-surface-border)]">
                    {s.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[var(--upt-text-primary)] truncate">{s.name}</p>
                    <p className="text-[11px] text-[var(--upt-text-tertiary)] truncate">{s.email}</p>
                  </div>
                  <span className="text-[11px] text-[var(--upt-text-tertiary)] shrink-0">{formatTime(s.last_login)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Quick Actions ────────────────────────────────────── */}
      <h2 className="text-[13px] font-semibold text-[var(--upt-text-tertiary)] uppercase tracking-widest mb-3">Acceso Rápido</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5" style={{ animation: 'fade-up 0.4s ease-out 0.15s both' }}>
        <QuickAction
          icon={TrendingUp}
          label="Analítica de Errores"
          desc="Patrones de error de los estudiantes"
          tab="teacher/analytics"
        />
        <QuickAction
          icon={Brain}
          label="Base de Conocimiento"
          desc="Alimentar a la IA con documentos y reglas"
          tab="teacher/knowledge"
        />
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value }) {
  return (
    <div className="p-5 rounded-xl bg-[var(--upt-surface)] border border-[var(--upt-surface-border)] flex items-start gap-4 hover:bg-[var(--upt-surface-light)] transition-colors">
      <div className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center bg-[var(--upt-surface-light)] border border-[var(--upt-surface-border)]">
        <Icon size={17} className="text-[var(--upt-text-secondary)]" />
      </div>
      <div>
        <p className="text-[11px] font-medium text-[var(--upt-text-tertiary)] uppercase tracking-wider mb-1">{label}</p>
        <p className="text-[28px] font-bold text-[var(--upt-text-primary)] leading-none">{value}</p>
      </div>
    </div>
  );
}

function StatRow({ label, value, highlight }) {
  return (
    <div className="flex justify-between items-center py-2 px-3 bg-[var(--upt-bg-deep)] rounded-lg border border-[var(--upt-surface-border)]">
      <span className="text-[13px] text-[var(--upt-text-tertiary)]">{label}</span>
      <span className={`text-base font-bold ${highlight ? 'text-[var(--upt-gold)]' : 'text-[var(--upt-text-primary)]'}`}>{value}</span>
    </div>
  );
}

function QuickAction({ icon: Icon, label, desc, tab }) {
  return (
    <button
      onClick={() => window.dispatchEvent(new CustomEvent('alda:navigate', { detail: tab }))}
      className="p-4 rounded-xl bg-[var(--upt-surface)] border border-[var(--upt-surface-border)] flex items-center gap-4 text-left transition-colors hover:bg-[var(--upt-surface-light)] hover:border-[var(--upt-gold)]/20 group cursor-pointer"
    >
      <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[var(--upt-surface-light)] border border-[var(--upt-surface-border)] shrink-0">
        <Icon className="w-4 h-4 text-[var(--upt-text-secondary)]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--upt-text-primary)]">{label}</p>
        <p className="text-[11px] text-[var(--upt-text-tertiary)] truncate">{desc}</p>
      </div>
      <ArrowUpRight className="w-4 h-4 text-[var(--upt-text-tertiary)] opacity-0 group-hover:opacity-50 transition-opacity shrink-0" />
    </button>
  );
}
