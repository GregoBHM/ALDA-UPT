import { useState, useEffect } from 'react';
import { Users, Code, Brain, Activity, Shield, ArrowUpRight, Server, Zap } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/api-stats`, {
        headers: { 'X-User-ID': currentUser.id },
        signal: AbortSignal.timeout(8000)
      });
      if (res.ok) {
        setStats(await res.json());
      } else {
        setStats({ total_assistant_calls: 0, total_compile_calls: 0, total_users: 0, calls_today: 0 });
      }
    } catch {
      setStats({ total_assistant_calls: 0, total_compile_calls: 0, total_users: 0, calls_today: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { label: 'Gestión de Usuarios',  desc: 'Administrar cuentas y roles',   icon: Users,    tab: 'admin/users'  },
    { label: 'Estado del Sistema',   desc: 'Salud de infraestructura',        icon: Activity, tab: 'admin/system' },
    { label: 'Consumo de API',       desc: 'Analítica de llamadas',           icon: Zap,      tab: 'admin/api'    },
    { label: 'Logs de Auditoría',    desc: 'Registro de actividad',           icon: Shield,   tab: 'admin/logs'   },
  ];

  return (
    <div className="p-6 lg:p-8 overflow-y-auto h-full">
      <div className="mb-8">
        <h1 className="text-[20px] font-bold text-[var(--upt-text-primary)] tracking-tight">Panel de Administración</h1>
        <p className="text-[var(--upt-text-tertiary)] text-sm mt-1">
          Bienvenido, {currentUser.name}. Vista general del sistema ALDA.
        </p>
      </div>

      {/* ─── Metrics ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8" style={{ animation: 'fade-up 0.4s ease-out 0.05s both' }}>
        <MetricCard icon={Users}  label="Usuarios"     value={isLoading ? '—' : stats.total_users}            sub="registrados"  />
        <MetricCard icon={Brain}  label="Consultas IA" value={isLoading ? '—' : stats.total_assistant_calls}  sub="total"        />
        <MetricCard icon={Code}   label="Compilac."    value={isLoading ? '—' : stats.total_compile_calls}    sub="ejecutadas"   />
        <MetricCard icon={Zap}    label="Actividad"    value={isLoading ? '—' : stats.calls_today}            sub="hoy"          />
      </div>

      {/* ─── Quick Actions ────────────────────────────────────── */}
      <h2 className="text-[13px] font-semibold text-[var(--upt-text-tertiary)] uppercase tracking-widest mb-3">Acceso Rápido</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-8" style={{ animation: 'fade-up 0.4s ease-out 0.1s both' }}>
        {quickActions.map((action, i) => {
          const Icon = action.icon;
          return (
            <button
              key={i}
              onClick={() => window.dispatchEvent(new CustomEvent('alda:navigate', { detail: action.tab }))}
              className="p-4 rounded-xl border border-[var(--upt-surface-border)] bg-[var(--upt-surface)] flex items-center gap-4 text-left transition-colors hover:bg-[var(--upt-surface-light)] hover:border-[var(--upt-gold)]/20 group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[var(--upt-accent)]/10 border border-[var(--upt-accent)]/20 shrink-0">
                <Icon className="w-4 h-4 text-[var(--upt-accent-light)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--upt-text-primary)]">{action.label}</p>
                <p className="text-[11px] text-[var(--upt-text-tertiary)] truncate">{action.desc}</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-[var(--upt-text-tertiary)] opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
            </button>
          );
        })}
      </div>

      {/* ─── Infra info ───────────────────────────────────────── */}
      <div className="p-5 rounded-xl bg-[var(--upt-surface)] border border-[var(--upt-surface-border)]" style={{ animation: 'fade-up 0.4s ease-out 0.15s both' }}>
        <div className="flex items-center gap-2 mb-4">
          <Server className="w-4 h-4 text-[var(--upt-gold)]" />
          <h2 className="text-[14px] font-semibold text-[var(--upt-text-primary)]">Infraestructura</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
          <InfoBadge label="Backend"      value="FastAPI"        />
          <InfoBadge label="Base de Datos" value="PostgreSQL 15" />
          <InfoBadge label="Vector Store"  value="ChromaDB"      />
          <InfoBadge label="IA"            value="Gemini 2.5"   />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="p-5 rounded-xl border border-[var(--upt-surface-border)] bg-[var(--upt-surface)] hover:bg-[var(--upt-surface-light)] transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="w-9 h-9 rounded-lg bg-[var(--upt-accent)]/10 border border-[var(--upt-accent)]/20 flex items-center justify-center">
          <Icon className="w-4 h-4 text-[var(--upt-accent-light)]" />
        </div>
      </div>
      <p className="text-[28px] font-bold text-[var(--upt-text-primary)] leading-none">{value}</p>
      <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--upt-text-tertiary)] mt-1.5">{label} <span className="lowercase normal-case">{sub}</span></p>
    </div>
  );
}

function InfoBadge({ label, value }) {
  return (
    <div className="py-3 px-3 bg-[var(--upt-bg-deep)] rounded-lg border border-[var(--upt-surface-border)]">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--upt-text-tertiary)] mb-1">{label}</p>
      <p className="text-[13px] font-semibold text-[var(--upt-text-primary)] font-mono">{value}</p>
    </div>
  );
}
