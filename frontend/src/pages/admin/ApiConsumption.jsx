import { useState, useEffect } from 'react';
import { Zap, TrendingUp, Code, Brain, Key, Save, Server, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function ApiConsumption() {
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState({ gemini_key: '', openai_key: '', active_model: 'gemini-2.5-flash' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');

  useEffect(() => { fetchData(); const interval = setInterval(() => fetchData(true), 15000); return () => clearInterval(interval); }, []);

  const fetchData = async (isPolling = false) => {
    if (!isPolling) setIsLoading(true);
    try {
      const headers = { 'X-User-ID': currentUser.id };
      const sig = AbortSignal.timeout(8000);
      const [statsRes, settingsRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/api-stats`, { credentials: 'include', headers, signal: sig }),
        fetch(`${API_BASE}/api/admin/settings`, { credentials: 'include', headers, signal: sig })
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (settingsRes.ok && !isPolling) {
        const s = await settingsRes.json();
        setSettings(prev => ({ ...prev, gemini_key: s.gemini_key || '', openai_key: s.openai_key || '', active_model: s.active_model || 'gemini-2.5-flash' }));
      }
    } catch { if (!isPolling) toast.error('Error cargando configuración'); }
    finally { if (!isPolling) setIsLoading(false); }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/settings`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-User-ID': currentUser.id }, body: JSON.stringify(settings)
      });
      if (res.ok) { toast.success('Configuración actualizada'); fetchData(); } else { toast.error('Error al guardar'); }
    } catch { toast.error('Fallo de conexión'); } finally { setIsSaving(false); }
  };

  if (isLoading || !stats) {
    return (
      <div className="p-6 lg:p-8 h-full">
        <div className="animate-pulse space-y-6">
          <div className="h-7 w-56 bg-[var(--upt-surface-light)] rounded" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-[var(--upt-surface-light)] rounded-xl" />)}</div>
        </div>
      </div>
    );
  }

  const metrics = [
    { icon: Brain,      label: 'Consultas IA',    value: stats.total_assistant_calls || 0, desc: 'Interacciones con el tutor socrático.' },
    { icon: Code,       label: 'Compilaciones',   value: stats.total_compile_calls || 0,   desc: 'Ejecuciones de código en sandbox.' },
    { icon: TrendingUp, label: 'Usuarios',        value: stats.total_users || 0,           desc: 'Cuentas activas en ALDA.' },
  ];

  return (
    <div className="p-6 lg:p-8 overflow-y-auto h-full">
      <div className="mb-8">
        <h1 className="text-[20px] font-bold text-[var(--upt-text-primary)] tracking-tight">Consumo de API & Tokens</h1>
        <p className="text-[var(--upt-text-tertiary)] text-sm mt-1">Métricas de uso y configuración de modelos LLM.</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className="p-5 rounded-xl bg-[var(--upt-surface)] border border-[var(--upt-surface-border)] hover:bg-[var(--upt-surface-light)] transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-[var(--upt-accent)]/10 border border-[var(--upt-accent)]/20 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-[var(--upt-accent-light)]" />
                </div>
              </div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--upt-text-tertiary)] mb-0.5">{m.label}</p>
              <p className="text-[28px] font-bold text-[var(--upt-text-primary)] leading-none mb-1">{m.value}</p>
              <p className="text-[11px] text-[var(--upt-text-tertiary)]">{m.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* API Keys form */}
        <div className="p-5 rounded-xl bg-[var(--upt-surface)] border border-[var(--upt-surface-border)]">
          <div className="flex items-center gap-2 mb-5">
            <Key className="w-4 h-4 text-[var(--upt-gold)]" />
            <h2 className="text-[14px] font-semibold text-[var(--upt-text-primary)]">Gestión de API Keys</h2>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--upt-text-tertiary)] mb-1.5">Google Gemini API Key</label>
              <input type="password" value={settings.gemini_key} onChange={(e) => setSettings({...settings, gemini_key: e.target.value})} placeholder="AIzaSy..."
                className="w-full bg-[var(--upt-bg-deep)] border border-[var(--upt-surface-border)] rounded-lg py-2.5 px-3.5 text-sm text-[var(--upt-text-primary)] focus:outline-none focus:border-[var(--upt-gold)]/40 transition-colors font-mono" />
              <p className="text-[10px] text-[var(--upt-text-tertiary)] mt-1">Modelo principal gemini-2.5-flash y vectorización.</p>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--upt-text-tertiary)] mb-1.5">OpenAI API Key (Fallback)</label>
              <input type="password" value={settings.openai_key} onChange={(e) => setSettings({...settings, openai_key: e.target.value})} placeholder="sk-proj-..."
                className="w-full bg-[var(--upt-bg-deep)] border border-[var(--upt-surface-border)] rounded-lg py-2.5 px-3.5 text-sm text-[var(--upt-text-primary)] focus:outline-none focus:border-[var(--upt-gold)]/40 transition-colors font-mono" />
              <p className="text-[10px] text-[var(--upt-text-tertiary)] mt-1">Respaldo en caso de interrupción de Google.</p>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--upt-text-tertiary)] mb-1.5">Motor Preferido</label>
              <select value={settings.active_model} onChange={(e) => setSettings({...settings, active_model: e.target.value})}
                className="w-full bg-[var(--upt-bg-deep)] border border-[var(--upt-surface-border)] rounded-lg py-2.5 px-3.5 text-sm font-semibold text-[var(--upt-text-primary)] focus:outline-none focus:border-[var(--upt-gold)]/40 cursor-pointer" style={{ colorScheme: 'inherit' }}>
                <optgroup label="Modelos Gemini (Google)" className="bg-[var(--upt-surface)] font-bold">
                  <option value="gemini-3-pro" className="font-normal">Gemini 3 Pro / 3.1 Pro</option>
                  <option value="gemini-3-flash" className="font-normal">Gemini 3 Flash / 3.1 Flash</option>
                  <option value="gemini-2.5-pro" className="font-normal">Gemini 2.5 Pro</option>
                  <option value="gemini-2.5-flash" className="font-normal">Gemini 2.5 Flash</option>
                  <option value="gemini-2.5-flash-lite" className="font-normal">Gemini 2.5 Flash-Lite</option>
                </optgroup>
                <optgroup label="Modelos GPT (OpenAI)" className="bg-[var(--upt-surface)] font-bold">
                  <option value="gpt-5.2-pro" className="font-normal">GPT-5.2 / GPT-5.2 Pro</option>
                  <option value="gpt-5-turbo" className="font-normal">GPT-5 / GPT-5 Turbo</option>
                  <option value="gpt-5-mini" className="font-normal">GPT-5 mini</option>
                  <option value="gpt-5-nano" className="font-normal">GPT-5 nano</option>
                  <option value="o1-mini" className="font-normal">o1 / o1-mini (Razonamiento)</option>
                </optgroup>
              </select>
            </div>
            <button type="submit" disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-[var(--upt-accent)] hover:bg-[var(--upt-accent-light)] text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 cursor-pointer">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </form>
        </div>

        {/* Production environment */}
        <div className="p-5 rounded-xl bg-[var(--upt-surface)] border border-[var(--upt-surface-border)]">
          <div className="flex items-center gap-2 mb-5">
            <Server className="w-4 h-4 text-[var(--upt-gold)]" />
            <h2 className="text-[14px] font-semibold text-[var(--upt-text-primary)]">Entorno de Producción</h2>
          </div>
          <div className="space-y-2.5">
            <EnvRow label="Timeout de Ejecución" value="10s" />
            <EnvRow label="Base de Datos Principal" value="PostgreSQL 15" />
            <EnvRow label="Base de Datos Vectorial" value="ChromaDB" />
            <div className="flex justify-between items-center py-2.5 px-3.5 bg-[var(--upt-bg-deep)] rounded-lg border border-[var(--upt-surface-border)]">
              <span className="text-[13px] text-[var(--upt-text-tertiary)]">Estado de Compiladores</span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--upt-success)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--upt-success)]" /> Activo
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EnvRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2.5 px-3.5 bg-[var(--upt-bg-deep)] rounded-lg border border-[var(--upt-surface-border)]">
      <span className="text-[13px] text-[var(--upt-text-tertiary)]">{label}</span>
      <span className="text-[13px] font-semibold text-[var(--upt-text-primary)] font-mono">{value}</span>
    </div>
  );
}
