import { useState, useEffect } from 'react';
import { X, CheckCircle2, XCircle, Terminal, AlertCircle, Clock, Box, Cpu, TestTube2, Brain, Loader2, Code2, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';

export default function TestResultsPanel({ results, onClose, isTesting, allPassed, passedCount, totalCount, code, language }) {
  const [loadingStep, setLoadingStep] = useState(0);
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    if (!isTesting) {
      setLoadingStep(0);
      return;
    }

    const t1 = setTimeout(() => setLoadingStep(1), 500);
    const t2 = setTimeout(() => setLoadingStep(2), 1200);
    const t3 = setTimeout(() => setLoadingStep(3), 2000);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [isTesting]);

  if (!results && !isTesting) return null;

  const isTimeout = (res) => !res.passed && typeof res.actual === 'string' && res.actual.includes('Tiempo límite');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-[var(--upt-bg-deep)] border border-[var(--upt-surface-border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">

        <div className="h-16 flex items-center justify-between px-5 border-b border-[var(--upt-surface-border)] bg-[var(--upt-surface)]">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
              isTesting ? 'bg-[var(--upt-surface-light)] border-[var(--upt-surface-border)]' :
              allPassed ? 'bg-[var(--upt-success)]/10 border-[var(--upt-success)]/20' : 'bg-[var(--upt-error)]/10 border-[var(--upt-error)]/20'
            }`}>
              {isTesting
                ? <Terminal className="w-4 h-4 text-[var(--upt-text-secondary)]" />
                : allPassed
                  ? <CheckCircle2 className="w-4 h-4 text-[var(--upt-success)]" />
                  : <XCircle className="w-4 h-4 text-[var(--upt-error)]" />}
            </div>
            <div>
              <h3 className="font-bold text-[var(--upt-text-primary)] text-[15px] leading-tight">
                {isTesting ? 'Validando...' : 'Reporte de Evaluación'}
              </h3>
              {!isTesting && (
                <p className="text-[12px] font-medium text-[var(--upt-text-secondary)]">
                  {passedCount}/{totalCount} casos · {totalCount > 0 ? ((passedCount / totalCount) * 100).toFixed(0) : 0}% de éxito
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--upt-text-secondary)] hover:text-[var(--upt-text-primary)] hover:bg-[var(--upt-surface-light)] border border-transparent hover:border-[var(--upt-surface-border)] transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {isTesting ? (
            <div className="flex flex-col gap-3 py-6 px-4 md:px-10 max-w-lg mx-auto">
              {[
                { label: 'Preparando entorno seguro...', icon: Box },
                { label: 'Compilando código fuente...', icon: Cpu },
                { label: 'Ejecutando casos de prueba...', icon: TestTube2 },
                { label: 'Análisis de IA Semántica en proceso...', icon: Brain }
              ].map((step, idx) => {
                const isPassed = loadingStep > idx;
                const isActive = loadingStep === idx;

                return (
                  <div key={idx} className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-500 ${
                    isPassed ? 'bg-[var(--upt-success)]/10 border-[var(--upt-success)]/30 text-[var(--upt-success)]' :
                    isActive ? 'bg-[var(--upt-gold)]/10 border-[var(--upt-gold)]/30 text-[var(--upt-gold)] shadow-[0_0_15px_rgba(255,215,0,0.1)]' :
                    'bg-[var(--upt-surface-light)] border-[var(--upt-surface-border)] opacity-40 text-[var(--upt-text-secondary)]'
                  }`}>
                    <div className="shrink-0">
                      {isPassed ? <CheckCircle2 className="w-6 h-6" /> :
                       isActive ? <Loader2 className="w-6 h-6 animate-spin" /> :
                       <step.icon className="w-6 h-6" />}
                    </div>
                    <div>
                      <span className="text-sm font-bold block">{step.label}</span>
                      {isActive && <span className="text-[11px] opacity-70 mt-0.5 block">Por favor espera...</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {allPassed ? (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--upt-success)]/10 border border-[var(--upt-success)]/20 shadow-[var(--upt-shadow-sm)]">
                  <CheckCircle2 className="w-6 h-6 text-[var(--upt-success)] shrink-0" />
                  <div>
                    <h4 className="text-[14px] font-bold text-[var(--upt-success)]">Todos los casos superados</h4>
                    <p className="text-[12px] text-[var(--upt-success)]">Tu solución ha sido registrada como completada.</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--upt-surface-light)] border border-[var(--upt-surface-border)] shadow-[var(--upt-shadow-sm)]">
                  <AlertCircle className="w-6 h-6 text-[var(--upt-gold)] shrink-0" />
                  <div>
                    <h4 className="text-[14px] font-bold text-[var(--upt-text-primary)]">Validación Incompleta</h4>
                    <p className="text-[12px] text-[var(--upt-text-secondary)]">{totalCount - passedCount} caso{totalCount - passedCount !== 1 ? 's' : ''} fallido{totalCount - passedCount !== 1 ? 's' : ''}. Revisa la traza de ejecución abajo.</p>
                  </div>
                </div>
              )}

              {code && (
                <div className="rounded-xl border border-[var(--upt-surface-border)] overflow-hidden">
                  <button
                    onClick={() => setShowCode(v => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-[var(--upt-surface-light)] hover:bg-[var(--upt-surface)] transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-[var(--upt-text-secondary)]" />
                      <span className="text-[12px] font-bold text-[var(--upt-text-secondary)] uppercase tracking-wider">Código evaluado</span>
                      <span className="text-[11px] text-[var(--upt-text-tertiary)]">{code.split('\n').length} líneas · {(language || 'code').toUpperCase()}</span>
                    </div>
                    {showCode ? <ChevronUp className="w-4 h-4 text-[var(--upt-text-tertiary)]" /> : <ChevronDown className="w-4 h-4 text-[var(--upt-text-tertiary)]" />}
                  </button>
                  {showCode && (
                    <div className="bg-[#0a0a1e] overflow-x-auto max-h-64 overflow-y-auto">
                      {code.split('\n').map((line, i) => (
                        <div key={i} className="flex items-stretch hover:bg-white/[0.02] transition-colors">
                          <span className="select-none w-10 shrink-0 text-right pr-3 py-1 text-[12px] font-mono text-[var(--upt-text-tertiary)] border-r border-[var(--upt-surface-border)]">{i + 1}</span>
                          <span className="px-4 py-1 font-mono text-[12px] text-[var(--upt-text-secondary)] whitespace-pre">{line || ' '}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-4">
                {results.map((res, idx) => (
                  <div
                    key={idx}
                    className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 shadow-[var(--upt-shadow-sm)] ${
                      res.passed
                        ? 'bg-[var(--upt-surface)] border-[var(--upt-surface-border)] hover:bg-[var(--upt-surface-light)]'
                        : 'bg-[var(--upt-error)]/[0.03] border-[var(--upt-error)]/30'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-stretch min-h-[80px]">
                      <div className={`w-2 ${res.passed ? 'bg-[var(--upt-success)]/40' : 'bg-[var(--upt-error)]'}`} />

                      <div className="flex-1 p-5">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] font-black uppercase tracking-widest text-[var(--upt-text-secondary)]">Prueba #{res.case_number}</span>
                            {res.is_hidden && (
                              <span className="px-2 py-0.5 rounded-md bg-[var(--upt-info)]/10 border border-[var(--upt-info)]/30 text-[10px] font-bold text-[var(--upt-info)] uppercase tracking-tighter">Oculto</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {isTimeout(res) ? (
                              <>
                                <span className="text-[12px] font-black uppercase tracking-wider text-amber-400">TIMEOUT</span>
                                <Clock className="w-5 h-5 text-amber-400" />
                              </>
                            ) : (
                              <>
                                <span className={`text-[12px] font-black uppercase tracking-wider ${res.passed ? 'text-[var(--upt-success)]' : 'text-[var(--upt-error)]'}`}>
                                  {res.passed ? 'PASADO' : 'FALLIDO'}
                                </span>
                                {res.passed ? (
                                  <CheckCircle2 className="w-5 h-5 text-[var(--upt-success)]" />
                                ) : (
                                  <XCircle className="w-5 h-5 text-[var(--upt-error)]" />
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {!res.is_hidden ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="flex flex-col gap-1 min-w-[72px]">
                              <span className="text-[10px] font-bold text-[var(--upt-text-tertiary)] uppercase tracking-wider">stdin</span>
                              <div className="bg-[#0a0a1e] border border-[var(--upt-surface-border)] px-3 py-2 rounded-lg font-mono text-[13px] text-[var(--upt-info)] whitespace-pre">
                                {res.input || '∅'}
                              </div>
                            </div>

                            <ArrowRight className="w-4 h-4 text-[var(--upt-text-tertiary)] mt-5 shrink-0" />

                            <div className="flex flex-col gap-1 flex-1 min-w-[80px]">
                              <span className="text-[10px] font-bold text-[var(--upt-text-tertiary)] uppercase tracking-wider">stdout</span>
                              <div className={`px-3 py-2 rounded-lg font-mono text-[13px] border whitespace-pre ${
                                res.passed
                                  ? 'bg-[var(--upt-success)]/10 border-[var(--upt-success)]/30 text-[var(--upt-success)]'
                                  : 'bg-[var(--upt-error)]/10 border-[var(--upt-error)]/30 text-[var(--upt-error)] font-bold'
                              }`}>
                                {res.actual}
                              </div>
                            </div>

                            {!res.passed && (
                              <>
                                <span className="text-[var(--upt-error)] font-black mt-5 text-base shrink-0">≠</span>
                                <div className="flex flex-col gap-1 min-w-[80px]">
                                  <span className="text-[10px] font-bold text-[var(--upt-text-tertiary)] uppercase tracking-wider">esperado</span>
                                  <div className="bg-[var(--upt-success)]/10 border border-[var(--upt-success)]/30 px-3 py-2 rounded-lg font-mono text-[13px] text-[var(--upt-success)] whitespace-pre">
                                    {res.expected}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        ) : (
                          <div className={`flex items-center gap-3 p-4 rounded-xl border ${
                            res.passed ? 'bg-[var(--upt-surface)] border-[var(--upt-surface-border)] text-[var(--upt-text-secondary)]' : 'bg-[var(--upt-error)]/10 border-[var(--upt-error)]/20 text-[var(--upt-error)]'
                          }`}>
                            <AlertCircle className="w-5 h-5 opacity-70" />
                            <span className="text-[12px] font-medium">
                              {res.passed
                                ? 'La lógica interna es correcta para este caso de prueba privado.'
                                : 'Tu código falló en este caso oculto. Revisa casos de borde como números negativos, ceros o textos vacíos.'}
                            </span>
                          </div>
                        )}

                        {res.error && !res.passed && (
                          <div className="mt-4 p-3 bg-[#0a0a1e] border border-[var(--upt-surface-border)] border-l-4 border-l-[var(--upt-error)] rounded-lg">
                            <span className="text-[11px] font-bold text-[var(--upt-error)] uppercase block mb-1">Error de Ejecución:</span>
                            <code className="text-[12px] text-[var(--upt-error)] break-all">{res.error}</code>
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
