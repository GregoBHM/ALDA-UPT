import { useState, useEffect } from 'react';
import { Database, Plus, Trash2, BookOpen, Send, X, FileText, Upload, File, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const MAX_PDF_SIZE_MB = 10;
const MAX_PDF_SIZE_BYTES = MAX_PDF_SIZE_MB * 1024 * 1024;

export default function KnowledgeManager() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('text');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pdfModal, setPdfModal] = useState(null); // { url, title }
  const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/teacher/knowledge`, {
        headers: { 'X-User-ID': currentUser.id }
      });
      if (res.ok) setItems(await res.json());
    } catch {
      toast.error('Error al cargar conocimiento');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitText = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return toast.error('Completa todos los campos');
    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/teacher/knowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-ID': currentUser.id },
        body: JSON.stringify({ title, content }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Guardado: ${data.chunks_created} fragmentos vectorizados`);
        resetForm();
        fetchItems();
      } else {
        const err = await res.json();
        toast.error(err.detail || 'Error al guardar');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitPdf = async (e) => {
    e.preventDefault();
    if (!title.trim() || !pdfFile) return toast.error('Selecciona un título y un archivo PDF');
    if (pdfFile.size > MAX_PDF_SIZE_BYTES) {
      return toast.error(`El archivo pesa ${(pdfFile.size / 1024 / 1024).toFixed(1)} MB. El límite máximo es ${MAX_PDF_SIZE_MB} MB.`);
    }
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('file', pdfFile);
      formData.append('title', title);

      const res = await fetch(`${API_BASE}/api/teacher/knowledge/upload-pdf`, {
        method: 'POST',
        headers: { 'X-User-ID': currentUser.id },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`PDF procesado: ${data.chunks_created} fragmentos, ${data.total_chars.toLocaleString()} caracteres`);
        resetForm();
        fetchItems();
      } else {
        const err = await res.json();
        toast.error(err.detail || 'Error al procesar PDF');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setPdfFile(null);
    setShowForm(false);
  };

  const handleViewPdf = (key, itemTitle) => {
    const url = `${API_BASE}/api/teacher/knowledge/view-pdf/${key}?x_user_id=${encodeURIComponent(currentUser.id)}`;
    setPdfModal({ url, title: itemTitle });
  };

  const handleDelete = async (key) => {
    if (!confirm('¿Eliminar este conocimiento de la BD y del vector store?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/teacher/knowledge/${key}`, {
        method: 'DELETE',
        headers: { 'X-User-ID': currentUser.id },
      });
      if (res.ok) {
        toast.success('Conocimiento eliminado');
        fetchItems();
      }
    } catch {
      toast.error('Error al eliminar');
    }
  };

  return (
    <div className="p-6 lg:p-8 overflow-y-auto h-full">

      {/* ===== MODAL VISOR DE PDF ===== */}
      {pdfModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
          onClick={() => setPdfModal(null)}
        >
          <div
            className="relative w-full max-w-5xl h-[90vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            style={{ backgroundColor: 'var(--upt-surface)', border: '1px solid rgba(255,255,255,0.08)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del modal */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b shrink-0"
              style={{ borderColor: 'var(--upt-surface-border)' }}>
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'rgba(59,130,246,0.15)' }}>
                  <File className="w-4 h-4" style={{ color: 'var(--upt-info)' }} />
                </div>
                <span className="text-sm font-bold" style={{ color: 'var(--upt-text-primary)' }}>
                  {pdfModal.title}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: 'rgba(59,130,246,0.1)', color: 'var(--upt-info)' }}>PDF</span>
              </div>
              <button
                onClick={() => setPdfModal(null)}
                className="p-2 rounded-xl transition-all"
                style={{ color: 'var(--upt-text-tertiary)' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = 'var(--upt-error)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--upt-text-tertiary)'; }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Iframe del PDF */}
            <iframe
              src={pdfModal.url}
              className="w-full flex-1 border-0"
              title={pdfModal.title}
            />
          </div>
        </div>
      )}
      {/* ============================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[22px] font-extrabold text-[var(--upt-text-primary)] tracking-tight">Base de Conocimiento</h1>
          <p className="text-[var(--upt-text-tertiary)] text-sm mt-1">
            Agrega reglas, guías y PDFs del curso. El asistente IA usará este material para guiar a los estudiantes.
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg ${showForm
            ? 'bg-[var(--upt-error)]/10 border border-[var(--upt-error)]/20 text-[var(--upt-error)] hover:bg-[var(--upt-error)]/20'
            : 'bg-gradient-to-r from-[var(--upt-accent)] to-[var(--upt-accent-light)] text-white hover:from-[var(--upt-accent-light)] hover:to-[var(--upt-accent)]'
            }`}>
          {showForm ? <><X className="w-4 h-4" /> Cancelar</> : <><Plus className="w-4 h-4" /> Agregar Conocimiento</>}
        </button>
      </div>

      {showForm && (
        <div className="mb-8 p-6 rounded-2xl bg-[var(--upt-surface)] border border-[var(--upt-accent)]/20 shadow-xl">
          <div className="flex gap-2 mb-6">
            <button onClick={() => setFormMode('text')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${formMode === 'text' ? 'bg-[var(--upt-accent-surface)] text-[var(--upt-accent)] border border-[var(--upt-accent)]/30' : 'bg-[var(--upt-surface-light)] text-[var(--upt-text-tertiary)] border border-[var(--upt-surface-border)] hover:bg-[var(--upt-surface-light)]'
                }`}>
              <BookOpen className="w-4 h-4" /> Texto / Regla
            </button>
            <button onClick={() => setFormMode('pdf')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${formMode === 'pdf' ? 'bg-[var(--upt-info)]/20 text-[var(--upt-info)] border border-[var(--upt-info)]/30' : 'bg-[var(--upt-surface-light)] text-[var(--upt-text-tertiary)] border border-[var(--upt-surface-border)] hover:bg-[var(--upt-surface-light)]'
                }`}>
              <Upload className="w-4 h-4" /> Subir PDF
            </button>
          </div>

          <form onSubmit={formMode === 'text' ? handleSubmitText : handleSubmitPdf} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-[var(--upt-text-tertiary)] mb-2">Título / Tema</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={formMode === 'text' ? 'Ej: Reglas de nomenclatura en C++' : 'Ej: Guía de Laboratorio 3 - Punteros'}
                className="w-full bg-[var(--upt-surface-light)] border border-[var(--upt-surface-border)] rounded-xl py-3 px-4 text-sm text-[var(--upt-text-primary)] focus:outline-none focus:border-[var(--upt-accent)]/50 focus:ring-4 focus:ring-[var(--upt-accent)]/5 transition-all"
              />
            </div>

            {formMode === 'text' ? (
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-[var(--upt-text-tertiary)] mb-2">Contenido / Regla / Guía</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                  placeholder={"Ej: En este curso, los estudiantes deben usar snake_case para las variables.\nLos arreglos deben iterarse con i < tamaño y no i <= tamaño.\nAntes de usar punteros, verificar que no sean NULL."}
                  className="w-full bg-[var(--upt-surface-light)] border border-[var(--upt-surface-border)] rounded-xl py-3 px-4 text-sm text-[var(--upt-text-primary)] focus:outline-none focus:border-[var(--upt-accent)]/50 focus:ring-4 focus:ring-[var(--upt-accent)]/5 transition-all resize-none font-mono leading-relaxed"
                />
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-[var(--upt-text-tertiary)] mb-2">Archivo PDF</label>
                <label className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${pdfFile ? 'border-[var(--upt-info)]/40 bg-[var(--upt-info)]/5' : 'border-[var(--upt-surface-border)] bg-[var(--upt-surface-light)]/40 hover:border-[var(--upt-surface-border)] hover:bg-[var(--upt-surface-light)]'
                  }`}>
                  <input type="file" accept=".pdf" className="hidden" onChange={(e) => {
                    const file = e.target.files[0];
                    if (file && file.size > MAX_PDF_SIZE_BYTES) {
                      toast.error(`El archivo pesa ${(file.size / 1024 / 1024).toFixed(1)} MB. El límite máximo es ${MAX_PDF_SIZE_MB} MB.`);
                      e.target.value = '';
                      return;
                    }
                    setPdfFile(file);
                  }} />
                  {pdfFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <File className="w-10 h-10 text-[var(--upt-info)]" />
                      <p className="text-sm font-bold text-[var(--upt-info)]">{pdfFile.name}</p>
                      <p className="text-[11px] text-[var(--upt-text-tertiary)]">{(pdfFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-10 h-10 text-[var(--upt-text-tertiary)] opacity-30" />
                      <p className="text-sm font-medium text-[var(--upt-text-tertiary)]">Arrastra o haz clic para seleccionar</p>
                      <p className="text-[11px] text-[var(--upt-text-tertiary)] opacity-60">Solo archivos .pdf — Máximo {MAX_PDF_SIZE_MB} MB</p>
                    </div>
                  )}
                </label>
              </div>
            )}

            <div className="flex justify-end">
              <button type="submit" disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[var(--upt-accent)] to-[var(--upt-accent-light)] text-white rounded-xl text-sm font-bold hover:from-[var(--upt-accent-light)] hover:to-[var(--upt-accent)] transition-all disabled:opacity-50 shadow-lg">
                <Send className="w-4 h-4" />
                {isSaving ? 'Procesando...' : formMode === 'text' ? 'Guardar y Vectorizar' : 'Subir y Vectorizar PDF'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="p-6 rounded-2xl bg-[var(--upt-surface)] border border-[var(--upt-surface-border)] animate-pulse">
              <div className="h-4 w-48 bg-[var(--upt-surface-light)] rounded mb-3"></div>
              <div className="h-3 w-full bg-[var(--upt-surface-light)] rounded mb-2"></div>
              <div className="h-3 w-3/4 bg-[var(--upt-surface-light)] rounded"></div>
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="py-20 text-center">
            <Database className="w-16 h-16 text-[var(--upt-text-tertiary)]/10 mx-auto mb-4" />
            <p className="text-lg font-bold text-[var(--upt-text-tertiary)]">La base de conocimiento está vacía</p>
            <p className="text-sm text-[var(--upt-text-tertiary)] opacity-60 mt-1 max-w-md mx-auto">
              Agrega reglas, guías o sube PDFs de la EPIS para que el asistente IA los use al guiar a los estudiantes.
            </p>
          </div>
        ) : items.map((item) => (
          <div key={item.key} className="p-6 rounded-2xl bg-[var(--upt-surface)] border border-[var(--upt-surface-border)] shadow-lg hover:border-[var(--upt-accent)]/40 hover:shadow-xl transition-all duration-200 group">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className={`p-2 rounded-lg border mt-0.5 transition-all ${item.source === 'pdf'
                  ? 'bg-[var(--upt-info)]/10 border-[var(--upt-info)]/20 group-hover:bg-[var(--upt-info)]/20'
                  : 'bg-[var(--upt-accent-surface)] border-[var(--upt-accent)]/20 group-hover:bg-[var(--upt-accent-surface)]'
                  }`}>
                  {item.source === 'pdf' ? <File className="w-4 h-4 text-[var(--upt-info)]" /> : <FileText className="w-4 h-4 text-[var(--upt-accent)]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-sm font-bold text-[var(--upt-text-primary)]">{item.title}</h3>
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${item.source === 'pdf' ? 'bg-[var(--upt-info)]/10 text-[var(--upt-info)]' : 'bg-[var(--upt-accent-surface)] text-[var(--upt-accent)]'
                      }`}>{item.source === 'pdf' ? 'PDF' : 'TEXTO'}</span>
                    {item.chunks > 0 && (
                      <span className="text-[9px] font-bold text-[var(--upt-success)] bg-[var(--upt-success)]/10 px-2 py-0.5 rounded-full">{item.chunks} fragmentos vectorizados</span>
                    )}
                  </div>
                  <p className="text-[12px] text-[var(--upt-text-tertiary)] mt-2 whitespace-pre-wrap leading-relaxed font-mono line-clamp-3">{item.content}</p>
                  {item.updated_at && (
                    <p className="text-[10px] text-[var(--upt-text-tertiary)] opacity-40 mt-3">
                      Actualizado: {new Date(item.updated_at).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {item.source === 'pdf' && item.pdf_file && (
                  <button
                    onClick={() => handleViewPdf(item.key, item.title)}
                    title="Ver PDF original"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[var(--upt-info)] bg-[var(--upt-info)]/10 hover:bg-[var(--upt-info)]/20 border border-[var(--upt-info)]/20 rounded-lg transition-all sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <Eye className="w-3.5 h-3.5" /> Ver PDF
                  </button>
                )}
                <button onClick={() => handleDelete(item.key)}
                  className="p-2 text-[var(--upt-text-tertiary)] hover:text-[var(--upt-error)] hover:bg-[var(--upt-error)]/10 rounded-lg transition-all sm:opacity-0 sm:group-hover:opacity-100">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
