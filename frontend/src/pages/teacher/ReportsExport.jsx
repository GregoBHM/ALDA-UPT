import { useState, useEffect } from 'react';
import {
  FileSpreadsheet, FileText, Download, BarChart3, Users,
  TrendingUp, Target, Loader2, RefreshCw, CheckCircle2, XCircle, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const STAT_CARDS = [
  { key: 'total_attempts',     label: 'Total de Intentos',    icon: BarChart3,   color: 'blue' },
  { key: 'total_students',     label: 'Estudiantes Activos',  icon: Users,       color: 'purple' },
  { key: 'pass_rate',          label: 'Tasa de Aprobación',   icon: TrendingUp,  color: 'emerald', suffix: '%' },
  { key: 'avg_attempts',       label: 'Intentos Promedio',    icon: Target,      color: 'amber' },
];

const COLOR_MAP = {
  blue:    'bg-[var(--upt-info)]/10 border-[var(--upt-info)]/20 text-[var(--upt-info)]',
  purple:  'bg-[var(--upt-info)]/10 border-[var(--upt-info)]/20 text-[var(--upt-info)]',
  emerald: 'bg-[var(--upt-success)]/10 border-[var(--upt-success)]/20 text-[var(--upt-success)]',
  amber:   'bg-[var(--upt-warning)]/10 border-[var(--upt-warning)]/20 text-[var(--upt-warning)]',
};

export default function ReportsExport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(null);
  const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');

  const fetchReport = async (isPolling = false) => {
    if (!isPolling) setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/teacher/error-analytics`, {
        credentials: 'include',
        headers: { 'X-User-ID': currentUser.id },
      });
      if (res.ok) {
        const raw = await res.json();
        const totalAttempts = raw.per_lab.reduce((s, l) => s + l.total, 0);
        const passedAttempts = raw.per_lab.reduce((s, l) => s + (l.passed || 0), 0);
        setData({
          ...raw,
          summary: {
            total_attempts: totalAttempts,
            total_students: raw.top_struggling?.length || 0,
            pass_rate: totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0,
            avg_attempts: raw.per_lab.length > 0
              ? (totalAttempts / raw.per_lab.length).toFixed(1)
              : 0,
          },
        });
      }
    } catch {
      if (!isPolling) toast.error('No se pudo cargar el reporte.');
    } finally {
      if (!isPolling) setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    const interval = setInterval(() => fetchReport(true), 15000);
    return () => clearInterval(interval);
  }, []);

  const handleExportExcel = async () => {
    setExporting('excel');
    try {
      const res = await fetch(`${API_BASE}/api/teacher/reports/export-excel`, {
        credentials: 'include',
        headers: { 'X-User-ID': currentUser.id },
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ALDA_Reporte_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Reporte Excel descargado.');
    } catch {
      toast.error('Error al generar el Excel. Asegúrate de tener datos.');
    } finally {
      setExporting(null);
    }
  };

  const handleExportPDF = () => {
    if (!data?.per_lab?.length) {
      toast.error('No hay datos para generar el PDF.');
      return;
    }
    setExporting('pdf');

    const totalAttempts = data.summary.total_attempts;
    const passRate = data.summary.pass_rate;
    const maxTotal = Math.max(...data.per_lab.map(l => l.total), 1);
    const fecha = new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });

    const labRows = data.per_lab.map(lab => {
      const passed = lab.passed || 0;
      const rate = lab.total > 0 ? Math.round((passed / lab.total) * 100) : 0;
      const barW = Math.round((lab.total / maxTotal) * 100);
      const rateColor = rate >= 70 ? '#10b981' : rate >= 40 ? '#f59e0b' : '#ef4444';
      return `<tr>
        <td style="padding:10px 14px;font-weight:600;border-bottom:1px solid #e2e8f0">${lab.lab}</td>
        <td style="padding:10px 14px;text-align:center;border-bottom:1px solid #e2e8f0">${lab.total}</td>
        <td style="padding:10px 14px;text-align:center;border-bottom:1px solid #e2e8f0;color:#7c3aed">${lab.with_ai}</td>
        <td style="padding:10px 14px;text-align:center;border-bottom:1px solid #e2e8f0;color:#10b981;font-weight:700">${passed}</td>
        <td style="padding:10px 14px;text-align:center;border-bottom:1px solid #e2e8f0;color:${rateColor};font-weight:700">${rate}%</td>
      </tr>`;
    }).join('');

    const barChart = data.per_lab.map(lab => {
      const barH = Math.round((lab.total / maxTotal) * 160);
      const aiH = Math.round((lab.with_ai / maxTotal) * 160);
      const name = lab.lab.length > 12 ? lab.lab.slice(0, 12) + '…' : lab.lab;
      return `<div style="display:flex;flex-direction:column;align-items:center;gap:6px;flex:1;min-width:60px">
        <div style="display:flex;align-items:flex-end;gap:3px;height:170px">
          <div style="width:18px;height:${barH}px;background:#3b82f6;border-radius:4px 4px 0 0"></div>
          <div style="width:18px;height:${aiH}px;background:#7c3aed;border-radius:4px 4px 0 0"></div>
        </div>
        <span style="font-size:9px;color:#64748b;text-align:center;max-width:70px;overflow:hidden">${name}</span>
      </div>`;
    }).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>Reporte ALDA - ${fecha}</title>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family:'Segoe UI',system-ui,sans-serif; color:#1e293b; background:#fff; }
      .page { padding:40px; max-width:800px; margin:0 auto; }
      .header { text-align:center; border-bottom:3px solid #00072D; padding-bottom:20px; margin-bottom:30px; }
      .header h1 { font-size:22px; color:#00072D; margin-bottom:4px; }
      .header p { font-size:12px; color:#64748b; }
      .metrics { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:30px; }
      .metric { padding:16px; border-radius:10px; border:1px solid #e2e8f0; text-align:center; }
      .metric .val { font-size:28px; font-weight:800; }
      .metric .lbl { font-size:10px; text-transform:uppercase; letter-spacing:0.08em; color:#64748b; margin-top:4px; }
      .section { margin-bottom:28px; }
      .section h2 { font-size:16px; font-weight:700; color:#00072D; margin-bottom:14px; border-left:3px solid #2563eb; padding-left:10px; }
      table { width:100%; border-collapse:collapse; font-size:13px; }
      th { padding:10px 14px; text-align:left; background:#f1f5f9; font-size:10px; text-transform:uppercase; letter-spacing:0.06em; color:#64748b; font-weight:700; border-bottom:2px solid #e2e8f0; }
      .chart-container { display:flex; align-items:flex-end; gap:8px; padding:20px; background:#f8fafc; border-radius:12px; border:1px solid #e2e8f0; }
      .legend { display:flex; gap:16px; margin-top:10px; font-size:11px; color:#64748b; }
      .legend span { display:flex; align-items:center; gap:5px; }
      .dot { width:10px; height:10px; border-radius:2px; display:inline-block; }
      .footer { text-align:center; font-size:10px; color:#94a3b8; margin-top:30px; padding-top:16px; border-top:1px solid #e2e8f0; }
      @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } .page { padding:20px; } }
    </style></head><body>
    <div class="page">
      <div class="header">
        <h1>📊 Reporte Académico ALDA</h1>
        <p>Universidad Privada de Tacna · EPIS · Generado el ${fecha}</p>
      </div>
      <div class="metrics">
        <div class="metric"><div class="val" style="color:#3b82f6">${totalAttempts}</div><div class="lbl">Total Intentos</div></div>
        <div class="metric"><div class="val" style="color:#8b5cf6">${data.summary.total_students}</div><div class="lbl">Estudiantes</div></div>
        <div class="metric"><div class="val" style="color:#10b981">${passRate}%</div><div class="lbl">Tasa Aprobación</div></div>
        <div class="metric"><div class="val" style="color:#f59e0b">${data.summary.avg_attempts}</div><div class="lbl">Intentos Prom.</div></div>
      </div>
      <div class="section">
        <h2>Gráfico de Actividad por Laboratorio</h2>
        <div class="chart-container">${barChart}</div>
        <div class="legend">
          <span><div class="dot" style="background:#3b82f6"></div> Total intentos</span>
          <span><div class="dot" style="background:#7c3aed"></div> Con ayuda IA</span>
        </div>
      </div>
      <div class="section">
        <h2>Detalle por Laboratorio</h2>
        <table><thead><tr><th>Laboratorio</th><th style="text-align:center">Total</th><th style="text-align:center">Con IA</th><th style="text-align:center">Aprobados</th><th style="text-align:center">Éxito</th></tr></thead>
        <tbody>${labRows}</tbody></table>
      </div>
      <div class="footer">ALDA — AI-based Learning & Development Assistant · Documento generado automáticamente</div>
    </div>
    <script>setTimeout(()=>window.print(),400)</script>
    </body></html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    setExporting(null);
    toast.success('PDF listo para descargar.');
  };

  if (loading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-[var(--upt-bg)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="text-[var(--upt-accent)] animate-spin" />
          <p className="text-sm text-[var(--upt-text-secondary)] font-medium">Cargando datos del reporte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-y-auto bg-[var(--upt-bg)]">
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1100px] mx-auto">

        <div className="flex flex-wrap items-start justify-between gap-5 mb-8" style={{ animation: 'fade-up 0.4s ease-out' }}>
          <div>
            <h2 className="text-[22px] font-extrabold text-[var(--upt-text-primary)] mb-1.5 tracking-tight">Exportación de Reportes</h2>
            <p className="text-sm text-[var(--upt-text-secondary)]">
              Descarga un informe completo del rendimiento académico de tus estudiantes.
            </p>
          </div>
          <button
            onClick={fetchReport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--upt-surface-border)] bg-[var(--upt-surface)] text-[13px] font-semibold text-[var(--upt-text-secondary)] shadow-sm cursor-pointer transition-all hover:bg-[var(--upt-surface-light)] hover:text-[var(--upt-text-primary)]"
          >
            <RefreshCw size={14} /> Actualizar datos
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 mb-8" style={{ animation: 'fade-up 0.4s ease-out 0.05s both' }}>
          {STAT_CARDS.map(({ key, label, icon: Icon, color, suffix }) => (
            <div key={key} className={`p-5 rounded-2xl border ${COLOR_MAP[color]} shadow-sm`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{label}</p>
                <div className="w-8 h-8 rounded-lg bg-[var(--upt-surface-light)] flex items-center justify-center">
                  <Icon size={16} />
                </div>
              </div>
              <p className="text-[28px] font-black">{data?.summary?.[key] ?? '—'}{suffix || ''}</p>
            </div>
          ))}
        </div>

        <div className="bg-[var(--upt-surface)] rounded-2xl border border-[var(--upt-surface-border)] overflow-hidden shadow-[var(--upt-shadow-md)] mb-6" style={{ animation: 'fade-up 0.4s ease-out 0.1s both' }}>
          <div className="px-6 py-4 border-b border-[var(--upt-surface-border)] flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-[var(--upt-text-primary)]">Vista previa · Rendimiento por Laboratorio</h3>
            <span className="text-xs text-[var(--upt-text-tertiary)]">{data?.per_lab?.length || 0} laboratorios</span>
          </div>

          {!data?.per_lab?.length ? (
            <div className="py-12 text-center opacity-50">
              <BarChart3 size={40} className="text-[var(--upt-text-tertiary)] mx-auto mb-3" />
              <p className="text-sm text-[var(--upt-text-secondary)]">Sin datos de laboratorios aún.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-[var(--upt-surface-border)]">
                    {['Laboratorio', 'Total Intentos', 'Con Ayuda IA', 'Aprobados', 'Tasa Éxito'].map(h => (
                      <th key={h} className={`px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--upt-text-tertiary)] bg-[var(--upt-surface-light)]/40 ${h === 'Laboratorio' ? 'text-left' : 'text-center'}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--upt-surface-border)]">
                  {data.per_lab.map((lab, i) => {
                    const passed = lab.passed || 0;
                    const rate = lab.total > 0 ? Math.round((passed / lab.total) * 100) : 0;
                    const rateColor = rate >= 70 ? 'text-[var(--upt-success)]' : rate >= 40 ? 'text-[var(--upt-warning)]' : 'text-[var(--upt-error)]';
                    const rateBg = rate >= 70 ? 'bg-[var(--upt-success)]' : rate >= 40 ? 'bg-[var(--upt-warning)]' : 'bg-[var(--upt-error)]';
                    return (
                      <tr key={i} className="hover:bg-[var(--upt-surface-light)]/40 transition-colors">
                        <td className="px-5 py-3.5 text-[13px] font-semibold text-[var(--upt-text-primary)]">
                          <div className="flex items-center gap-2.5">
                            <div className="w-2 h-2 rounded-full bg-[var(--upt-accent)] shrink-0" />
                            {lab.lab}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-center text-sm font-bold text-[var(--upt-text-primary)]">{lab.total}</td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="text-[13px] font-bold px-2.5 py-0.5 rounded-full bg-[var(--upt-info)]/10 text-[var(--upt-info)]">{lab.with_ai}</span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="inline-flex items-center gap-1 text-[13px] font-bold text-[var(--upt-success)]">
                            <CheckCircle2 size={13} /> {passed}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <div className="flex items-center gap-2 justify-center">
                            <div className="flex-1 max-w-[80px] h-1.5 rounded-full bg-[var(--upt-surface-border)] overflow-hidden">
                              <div className={`h-full ${rateBg} rounded-full transition-all duration-700`} style={{ width: `${rate}%` }} />
                            </div>
                            <span className={`text-xs font-bold ${rateColor} min-w-[34px]`}>{rate}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5" style={{ animation: 'fade-up 0.4s ease-out 0.15s both' }}>
          <button
            onClick={handleExportExcel}
            disabled={exporting === 'excel'}
            className="flex items-center justify-center gap-3 px-7 py-5 rounded-2xl border-none bg-gradient-to-br from-[var(--upt-success)] to-[var(--upt-success)] text-white cursor-pointer text-[15px] font-bold transition-all duration-200 shadow-[0_4px_20px_rgba(22,163,74,0.3)] disabled:opacity-70 hover:-translate-y-0.5 hover:shadow-[0_6px_28px_rgba(22,163,74,0.4)] group"
          >
            {exporting === 'excel'
              ? <Loader2 size={20} className="animate-spin" />
              : <FileSpreadsheet size={22} />
            }
            <div className="text-left">
              <p className="text-[15px] font-extrabold">Descargar Excel</p>
              <p className="text-xs opacity-75 font-normal">Formato .xlsx con todas las métricas</p>
            </div>
            <Download size={18} className="ml-auto opacity-60 group-hover:opacity-100 transition-opacity" />
          </button>

          <button
            onClick={handleExportPDF}
            disabled={exporting === 'pdf'}
            className="flex items-center justify-center gap-3 px-7 py-5 rounded-2xl border-none bg-gradient-to-br from-[var(--upt-error)] to-[var(--upt-error)] text-white cursor-pointer text-[15px] font-bold transition-all duration-200 shadow-[0_4px_20px_rgba(220,38,38,0.3)] disabled:opacity-70 hover:-translate-y-0.5 hover:shadow-[0_6px_28px_rgba(220,38,38,0.4)] group"
          >
            {exporting === 'pdf'
              ? <Loader2 size={20} className="animate-spin" />
              : <FileText size={22} />
            }
            <div className="text-left">
              <p className="text-[15px] font-extrabold">Descargar PDF</p>
              <p className="text-xs opacity-75 font-normal">Informe visual con gráficos</p>
            </div>
            <Download size={18} className="ml-auto opacity-60 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </div>
    </div>
  );
}
