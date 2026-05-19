import { X, CheckCircle2, XCircle, Terminal, AlertCircle } from 'lucide-react';

export default function TestResultsPanel({ results, onClose, isTesting, allPassed, passedCount, totalCount }) {
  if (!results && !isTesting) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-[var(--upt-surface)] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
              isTesting ? 'bg-[var(--upt-surface-light)]' :
              allPassed ? 'bg-emerald-500/10' : 'bg-rose-500/10'
            }`}>
              {isTesting
                ? <Terminal className="w-3.5 h-3.5 text-[var(--upt-text-tertiary)]" />
                : allPassed
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  : <XCircle className="w-3.5 h-3.5 text-rose-400" />}
            </div>
            <div>
              <h3 className="font-semibold text-[var(--upt-text-primary)] text-[14px] leading-tight">
                {isTesting ? 'Validando...' : 'Reporte de Evaluación'}
              </h3>
              {!isTesting && (
                <p className="text-[11px] text-[var(--upt-text-tertiary)]">
                  {passedCount}/{totalCount} casos · {((passedCount / totalCount) * 100).toFixed(0)}% de éxito
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--upt-text-tertiary)] hover:text-[var(--upt-text-primary)] hover:bg-white/[0.06] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {isTesting ? (
            <div className="h-48 flex flex-col items-center justify-center gap-4">
              <div className="w-8 h-8 border-2 border-white/10 border-t-white/60 rounded-full animate-spin" />
              <div className="text-center">
                <p className="text-[var(--upt-text-primary)] text-sm font-medium mb-0.5">Ejecutando Pruebas</p>
                <p className="text-xs text-[var(--upt-text-tertiary)]">Verificando casos de borde en el Sandbox...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Result Summary */}
              {allPassed ? (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <h4 className="text-[14px] font-semibold text-emerald-400">Todos los casos superados</h4>
                    <p className="text-[12px] text-emerald-400/60">Tu solución ha sido registrada como completada.</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--upt-surface-light)] border border-white/[0.07]">
                  <AlertCircle className="w-5 h-5 text-[var(--upt-gold)]/70 shrink-0" />
                  <div>
                    <h4 className="text-[14px] font-semibold text-[var(--upt-text-primary)]">Validación Incompleta</h4>
                    <p className="text-[12px] text-[var(--upt-text-tertiary)]">{totalCount - passedCount} caso{totalCount - passedCount !== 1 ? 's' : ''} fallido{totalCount - passedCount !== 1 ? 's' : ''}. Revisa la comparativa abajo.</p>
                  </div>
                </div>
              )}

              {/* Lista Vertical de Casos */}
              <div className="space-y-4">
                {results.map((res, idx) => (
                  <div 
                    key={idx}
                    className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${
                      res.passed 
                        ? 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]' 
                        : 'bg-rose-500/[0.03] border-rose-500/20 shadow-[0_0_40px_rgba(244,63,94,0.05)]'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-stretch min-h-[80px]">
                      {/* Indicador Lateral */}
                      <div className={`w-1.5 ${res.passed ? 'bg-emerald-500/40' : 'bg-rose-500'}`} />
                      
                      <div className="flex-1 p-5">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Prueba #{res.case_number}</span>
                            {res.is_hidden && (
                              <span className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-[9px] font-bold text-blue-400 uppercase tracking-tighter">Oculto</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold ${res.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {res.passed ? 'PASADO' : 'FALLIDO'}
                            </span>
                            {res.passed ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            ) : (
                              <XCircle className="w-5 h-5 text-rose-400" />
                            )}
                          </div>
                        </div>

                        {!res.is_hidden ? (
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {/* Bloque Input */}
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-bold text-white/30 uppercase ml-1">Entrada (Input)</span>
                              <div className="bg-black/40 border border-white/5 p-3 rounded-xl font-mono text-[13px] text-blue-300 overflow-x-auto whitespace-pre">
                                {res.input || 'Sin entrada'}
                              </div>
                            </div>
                            {/* Bloque Esperado */}
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-bold text-white/30 uppercase ml-1">Esperado</span>
                              <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl font-mono text-[13px] text-emerald-300 overflow-x-auto whitespace-pre">
                                {res.expected}
                              </div>
                            </div>
                            {/* Bloque Obtenido */}
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-bold text-white/30 uppercase ml-1">Tu Salida</span>
                              <div className={`border p-3 rounded-xl font-mono text-[13px] overflow-x-auto whitespace-pre ${
                                res.passed ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400 font-bold'
                              }`}>
                                {res.actual}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className={`flex items-center gap-3 p-4 rounded-xl border ${
                            res.passed ? 'bg-white/5 border-white/5 text-white/40' : 'bg-rose-500/10 border-rose-500/10 text-rose-400'
                          }`}>
                            <AlertCircle className="w-4 h-4 opacity-50" />
                            <span className="text-xs italic">
                              {res.passed 
                                ? 'La lógica interna es correcta para este caso de prueba privado.' 
                                : 'Tu código falló en este caso oculto. Revisa casos de borde como números negativos, ceros o textos vacíos.'}
                            </span>
                          </div>
                        )}
                        
                        {res.error && !res.passed && (
                          <div className="mt-4 p-3 bg-black/40 border-l-2 border-rose-500 rounded-r-lg">
                            <span className="text-[10px] font-bold text-rose-500 uppercase block mb-1">Error de Ejecución:</span>
                            <code className="text-xs text-rose-300 break-all">{res.error}</code>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
