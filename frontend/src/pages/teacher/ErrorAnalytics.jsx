import { useState, useEffect } from 'react';
import { PieChart, AlertTriangle, Users, FlaskConical, TrendingDown, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function ErrorAnalytics() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');

  const fetchAnalytics = async (isPolling = false) => {
    if (!isPolling) setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/teacher/error-analytics`, {
        headers: { 'X-User-ID': currentUser.id }
      });
      if (res.ok) setData(await res.json());
      else if (!isPolling) setData({ per_lab: [], error_patterns: [], top_struggling: [], total_analyzed: 0 });
    } catch {
      if (!isPolling) setData({ per_lab: [], error_patterns: [], top_struggling: [], total_analyzed: 0 });
    } finally {
      if (!isPolling) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(() => fetchAnalytics(true), 15000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 h-full animate-pulse">
        <div className="h-8 w-64 bg-white/5 rounded mb-8"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-64 bg-white/5 rounded-2xl"></div>)}
        </div>
      </div>
    );
  }

  const maxPatternCount = Math.max(...data.error_patterns.map(p => p.count), 1);
  const patternColors = ['rose', 'amber', 'orange', 'purple', 'blue', 'indigo'];

  return (
    <div className="p-6 lg:p-8 overflow-y-auto h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[22px] font-extrabold text-[var(--upt-text-primary)] tracking-tight">Analítica de Errores</h1>
          <p className="text-[var(--upt-text-tertiary)] text-sm mt-1">
            Análisis de {data.total_analyzed} intentos recientes de los estudiantes.
          </p>
        </div>
        <button onClick={() => fetchAnalytics(true)} disabled={isLoading}
          className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-semibold text-[var(--upt-text-secondary)] hover:bg-white/10 transition-all">
          <RefreshCw className="w-4 h-4" /> Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="p-6 rounded-2xl bg-[var(--upt-surface)] border border-white/6 shadow-lg">
          <h2 className="text-lg font-bold text-[var(--upt-text-primary)] mb-5 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            Patrones de Error Detectados
          </h2>
          {data.error_patterns.length === 0 ? (
            <div className="py-10 text-center text-[var(--upt-text-tertiary)]">
              <PieChart className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="font-medium">Sin datos suficientes aún</p>
              <p className="text-[11px] mt-1 opacity-60">Los patrones aparecerán cuando los alumnos usen el asistente IA.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.error_patterns.map((p, i) => {
                const pct = Math.round((p.count / maxPatternCount) * 100);
                const color = patternColors[i % patternColors.length];
                const colorClasses = {
                  rose: 'bg-rose-500/20 text-rose-400',
                  amber: 'bg-amber-500/20 text-amber-400',
                  orange: 'bg-orange-500/20 text-orange-400',
                  purple: 'bg-purple-500/20 text-purple-400',
                  blue: 'bg-blue-500/20 text-blue-400',
                  indigo: 'bg-indigo-500/20 text-indigo-400',
                };
                const barColors = {
                  rose: 'from-rose-500 to-rose-400',
                  amber: 'from-amber-500 to-amber-400',
                  orange: 'from-orange-500 to-orange-400',
                  purple: 'from-purple-500 to-purple-400',
                  blue: 'from-blue-500 to-blue-400',
                  indigo: 'from-indigo-500 to-indigo-400',
                };
                return (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-semibold text-[var(--upt-text-primary)]">{p.pattern}</span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${colorClasses[color]}`}>{p.count} casos</span>
                    </div>
                    <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full bg-gradient-to-r ${barColors[color]} transition-all duration-1000`} style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-6 rounded-2xl bg-[var(--upt-surface)] border border-white/6 shadow-lg">
          <h2 className="text-lg font-bold text-[var(--upt-text-primary)] mb-5 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-amber-400" />
            Estudiantes que más Ayuda Necesitan
          </h2>
          {data.top_struggling.length === 0 ? (
            <div className="py-10 text-center text-[var(--upt-text-tertiary)]">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="font-medium">Sin datos</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.top_struggling.map((s, i) => (
                <div key={i} className="flex items-center gap-3 py-3 px-4 bg-white/[0.02] rounded-xl">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm
                    ${i === 0 ? 'bg-rose-500/20 text-rose-400' : i === 1 ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-[var(--upt-text-tertiary)]'}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--upt-text-primary)] truncate">{s.student}</p>
                  </div>
                  <span className="text-sm font-bold text-purple-400">{s.ai_requests} <span className="text-[10px] font-medium opacity-60">consultas IA</span></span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-[var(--upt-surface)] border border-white/6 shadow-lg">
        <h2 className="text-lg font-bold text-[var(--upt-text-primary)] mb-5 flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-emerald-400" />
          Rendimiento por Laboratorio
        </h2>
        {data.per_lab.length === 0 ? (
          <div className="py-10 text-center text-[var(--upt-text-tertiary)]">
            <FlaskConical className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="font-medium">Sin laboratorios registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/6 text-[11px] uppercase tracking-wider text-[var(--upt-text-tertiary)] font-bold">
                  <th className="px-4 py-3">Laboratorio</th>
                  <th className="px-4 py-3 text-center">Total Intentos</th>
                  <th className="px-4 py-3 text-center">Con Ayuda IA</th>
                  <th className="px-4 py-3 text-center">Tasa Autonomía</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/4">
                {data.per_lab.map((lab, i) => {
                  const autonomy = lab.total > 0 ? Math.round(((lab.total - lab.with_ai) / lab.total) * 100) : 100;
                  return (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 text-sm font-semibold text-[var(--upt-text-primary)]">{lab.lab}</td>
                      <td className="px-4 py-3 text-center text-sm font-bold text-[var(--upt-text-secondary)]">{lab.total}</td>
                      <td className="px-4 py-3 text-center text-sm font-bold text-purple-400">{lab.with_ai}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-sm font-bold ${autonomy >= 70 ? 'text-emerald-400' : autonomy >= 40 ? 'text-amber-400' : 'text-rose-400'}`}>
                          {autonomy}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
