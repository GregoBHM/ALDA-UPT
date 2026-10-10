import { useState, useEffect } from 'react';
import { ShieldCheck, User, Code, Brain, Settings, Search, Filter, RefreshCw } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');
    try {
      const res = await fetch(`${API_BASE}/api/admin/audit-logs`, {
        headers: { 'X-User-ID': currentUser.id },
        signal: AbortSignal.timeout(8000)
      });
      if (res.ok) { setLogs(await res.json()); } else { setLogs([]); }
    } catch { setLogs([]); } finally { setIsLoading(false); }
  };

  const typeConfig = {
    auth:    { icon: User,     label: 'Auth' },
    compile: { icon: Code,     label: 'Código' },
    ai:      { icon: Brain,    label: 'IA' },
    admin:   { icon: Settings, label: 'Admin' },
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) || log.user.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || log.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const formatTime = (ts) => {
    const d = new Date(ts); const now = new Date(); const diff = now - d;
    if (diff < 60000) return 'Hace un momento';
    if (diff < 3600000) return `Hace ${Math.floor(diff/60000)} min`;
    if (diff < 86400000) return `Hace ${Math.floor(diff/3600000)}h`;
    return d.toLocaleDateString();
  };

  return (
    <div className="p-6 lg:p-8 overflow-y-auto h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[20px] font-bold text-[var(--upt-text-primary)] tracking-tight">Logs de Auditoría</h1>
          <p className="text-[var(--upt-text-tertiary)] text-sm mt-1">Registro de actividad reciente en ALDA.</p>
        </div>
        <button onClick={fetchLogs} disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--upt-surface)] border border-[var(--upt-surface-border)] rounded-lg text-sm font-semibold text-[var(--upt-text-secondary)] hover:bg-[var(--upt-surface-light)] hover:border-[var(--upt-gold)]/20 transition-colors disabled:opacity-40 cursor-pointer">
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Actualizar
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--upt-text-tertiary)]" />
          <input type="text" placeholder="Buscar en logs..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-[var(--upt-surface)] border border-[var(--upt-surface-border)] rounded-lg py-2 pl-10 pr-4 text-sm text-[var(--upt-text-primary)] focus:outline-none focus:border-[var(--upt-gold)]/40 w-full transition-colors" />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--upt-text-tertiary)]" />
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
            className="bg-[var(--upt-surface)] border border-[var(--upt-surface-border)] rounded-lg py-2 pl-10 pr-8 text-sm text-[var(--upt-text-primary)] focus:outline-none cursor-pointer appearance-none" style={{ colorScheme: 'inherit' }}>
            <option value="all" className="bg-[var(--upt-surface)]">Todos</option>
            <option value="auth" className="bg-[var(--upt-surface)]">Autenticación</option>
            <option value="compile" className="bg-[var(--upt-surface)]">Compilación</option>
            <option value="ai" className="bg-[var(--upt-surface)]">Asistente IA</option>
            <option value="admin" className="bg-[var(--upt-surface)]">Administración</option>
          </select>
        </div>
      </div>

      <div className="bg-[var(--upt-surface)] rounded-xl border border-[var(--upt-surface-border)] overflow-hidden">
        <div className="divide-y divide-[var(--upt-surface-border)]">
          {isLoading ? Array(5).fill(0).map((_, i) => (
            <div key={i} className="px-5 py-3.5 animate-pulse flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-[var(--upt-surface-light)]" />
              <div className="flex-1 space-y-1.5"><div className="h-3 w-64 bg-[var(--upt-surface-light)] rounded" /><div className="h-2.5 w-32 bg-[var(--upt-surface-light)] rounded" /></div>
              <div className="h-5 w-14 bg-[var(--upt-surface-light)] rounded-md" />
            </div>
          )) : filteredLogs.length === 0 ? (
            <div className="py-16 text-center">
              <ShieldCheck className="w-8 h-8 text-[var(--upt-text-tertiary)]/10 mx-auto mb-3" />
              <p className="text-sm text-[var(--upt-text-tertiary)]">No se encontraron registros.</p>
            </div>
          ) : filteredLogs.map(log => {
            const config = typeConfig[log.type] || typeConfig.admin;
            const Icon = config.icon;
            return (
              <div key={log.id} className="px-5 py-3.5 hover:bg-[var(--upt-surface-light)]/40 transition-colors flex items-center gap-3">
                <div className="w-8 h-8 rounded-md flex items-center justify-center bg-[var(--upt-surface-light)] border border-[var(--upt-surface-border)] shrink-0">
                  <Icon className="w-3.5 h-3.5 text-[var(--upt-text-secondary)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-[var(--upt-text-primary)] truncate">{log.action}</p>
                  <p className="text-[11px] text-[var(--upt-text-tertiary)]">{log.user} · {formatTime(log.timestamp)}</p>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border border-[var(--upt-surface-border)] text-[var(--upt-text-tertiary)] bg-[var(--upt-bg-deep)] hidden sm:inline-block">
                  {config.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
