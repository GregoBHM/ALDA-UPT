import { useState, useEffect } from 'react';
import { Activity, Database, Cpu, HardDrive, Wifi, RefreshCw, Server, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function SystemStatus() {
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState(null);

  const checkServices = async (isPolling = false, showToast = false) => {
    if (!isPolling) setIsLoading(true);
    const checks = [];
    const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');

    const checkEndpoint = async (name, url, icon, description) => {
      const start = Date.now();
      try {
        const res = await fetch(url, {
          credentials: 'include',
          headers: { 'X-User-ID': currentUser.id },
          signal: AbortSignal.timeout(5000)
        });
        const latency = Date.now() - start;
        return { name, icon, description, status: res.ok ? 'online' : 'degraded', latency: `${latency}ms`, statusCode: res.status };
      } catch {
        return { name, icon, description, status: 'offline', latency: '—', statusCode: null };
      }
    };

    checks.push(await checkEndpoint('API Backend (FastAPI)', `${API_BASE}/docs`, Server, 'Servidor principal de autenticación, compilación y asistente IA.'));
    checks.push(await checkEndpoint('Base de Datos (PostgreSQL)', `${API_BASE}/api/admin/users`, Database, 'Base de datos relacional de usuarios, cursos y laboratorios.'));
    checks.push(await checkEndpoint('Asistente IA (Gemini)', `${API_BASE}/api/student/assistant`, Cpu, 'Motor de inteligencia artificial para el tutor socrático.'));

    setServices(checks);
    setLastCheck(new Date());
    if (!isPolling) { setIsLoading(false); if (showToast) toast.success('Verificación completada', { position: 'bottom-right' }); }
  };

  useEffect(() => { checkServices(); const interval = setInterval(() => checkServices(true), 15000); return () => clearInterval(interval); }, []);

  const onlineCount = services.filter(s => s.status === 'online').length;

  return (
    <div className="p-6 lg:p-8 overflow-y-auto h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[20px] font-bold text-[var(--upt-text-primary)] tracking-tight">Estado del Sistema</h1>
          <p className="text-[var(--upt-text-tertiary)] text-sm mt-1">Monitoreo en tiempo real de los servicios de ALDA.</p>
        </div>
        <button onClick={() => checkServices(false, true)} disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--upt-surface)] border border-[var(--upt-surface-border)] rounded-lg text-sm font-semibold text-[var(--upt-text-secondary)] hover:bg-[var(--upt-surface-light)] hover:border-[var(--upt-gold)]/20 transition-colors disabled:opacity-40 cursor-pointer">
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Verificar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <SummaryCard icon={Wifi} label="Servicios Activos" value={`${onlineCount} / ${services.length}`} />
        <SummaryCard icon={HardDrive} label="Infraestructura" value="Docker + VPS" small />
        <SummaryCard icon={Clock} label="Última Verificación" value={lastCheck ? lastCheck.toLocaleTimeString() : '—'} small />
      </div>

      <div className="space-y-2.5">
        {isLoading ? Array(3).fill(0).map((_, i) => (
          <div key={i} className="p-5 rounded-xl bg-[var(--upt-surface)] border border-[var(--upt-surface-border)] animate-pulse">
            <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-lg bg-[var(--upt-surface-light)]" /><div className="flex-1 space-y-2"><div className="h-3.5 w-48 bg-[var(--upt-surface-light)] rounded" /><div className="h-3 w-72 bg-[var(--upt-surface-light)] rounded" /></div><div className="h-6 w-20 bg-[var(--upt-surface-light)] rounded-md" /></div>
          </div>
        )) : services.map((svc, i) => {
          const Icon = svc.icon;
          const dotColor = svc.status === 'online' ? 'bg-[var(--upt-success)]' : svc.status === 'degraded' ? 'bg-[var(--upt-warning)]' : 'bg-[var(--upt-error)]';
          const textColor = svc.status === 'online' ? 'text-[var(--upt-success)]' : svc.status === 'degraded' ? 'text-[var(--upt-warning)]' : 'text-[var(--upt-error)]';
          const borderColor = svc.status === 'online' ? 'border-[var(--upt-success)]/20' : svc.status === 'degraded' ? 'border-[var(--upt-warning)]/20' : 'border-[var(--upt-error)]/20';
          const statusLabel = svc.status === 'online' ? 'En Línea' : svc.status === 'degraded' ? 'Degradado' : 'Offline';
          return (
            <div key={i} className="p-5 rounded-xl bg-[var(--upt-surface)] border border-[var(--upt-surface-border)] hover:bg-[var(--upt-surface-light)] transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[var(--upt-accent)]/10 border border-[var(--upt-accent)]/20 shrink-0">
                  <Icon className="w-5 h-5 text-[var(--upt-accent-light)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[13px] font-semibold text-[var(--upt-text-primary)]">{svc.name}</h3>
                  <p className="text-[12px] text-[var(--upt-text-tertiary)] mt-0.5">{svc.description}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--upt-text-tertiary)]">Latencia</p>
                    <p className="text-sm font-semibold text-[var(--upt-text-secondary)]">{svc.latency}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border bg-transparent ${textColor} ${borderColor}`}>
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
                    {statusLabel}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, small }) {
  return (
    <div className="p-4 rounded-xl bg-[var(--upt-surface)] border border-[var(--upt-surface-border)] flex items-center gap-3.5">
      <div className="w-9 h-9 rounded-lg bg-[var(--upt-accent)]/10 border border-[var(--upt-accent)]/20 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-[var(--upt-accent-light)]" />
      </div>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--upt-text-tertiary)]">{label}</p>
        <p className={`font-bold text-[var(--upt-text-primary)] leading-tight ${small ? 'text-sm' : 'text-xl'}`}>{value}</p>
      </div>
    </div>
  );
}
