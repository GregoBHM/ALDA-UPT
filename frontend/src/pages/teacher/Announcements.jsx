import { useState, useEffect } from 'react';
import { Megaphone, Plus, Trash2, Loader2, Send, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/teacher/announcements`, {
        credentials: 'include',
        headers: { 'X-User-ID': user.id },
      });
      if (res.ok) setAnnouncements(await res.json());
    } catch {
      toast.error('No se pudieron cargar los anuncios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/teacher/announcements`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-User-ID': user.id },
        body: JSON.stringify({ title: title.trim(), content: content.trim() }),
      });
      if (!res.ok) throw new Error((await res.json()).detail);
      toast.success('Notificación publicada correctamente.');
      setTitle('');
      setContent('');
      fetchAnnouncements();
    } catch (err) {
      toast.error(err.message || 'Error al publicar.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/teacher/announcements/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'X-User-ID': user.id },
      });
      if (!res.ok) throw new Error();
      toast.success('Notificación eliminada.');
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch {
      toast.error('No se pudo eliminar el anuncio.');
    }
  };

  return (
    <div className="absolute inset-0 overflow-y-auto bg-[var(--upt-bg)]">
      <div className="p-4 sm:p-6 lg:p-8 max-w-[820px] mx-auto">

        <div className="flex items-center gap-3.5 mb-2" style={{ animation: 'fade-up 0.4s ease-out' }}>
          <div className="w-11 h-11 rounded-xl bg-[var(--upt-gold)]/10 border border-[var(--upt-gold)]/15 flex items-center justify-center">
            <Megaphone size={22} className="text-[var(--upt-gold)]" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[var(--upt-text-primary)] tracking-tight">Gestión de Notificaciones</h2>
            <p className="text-[13px] text-[var(--upt-text-secondary)] mt-0.5">Publica notificaciones visibles para todos los usuarios de la plataforma.</p>
          </div>
        </div>

        <form onSubmit={handleCreate} className="bg-[var(--upt-surface)] rounded-2xl border border-[var(--upt-surface-border)] p-6 shadow-sm mb-6 mt-6" style={{ animation: 'fade-up 0.4s ease-out 0.05s both' }}>
          <p className="text-xs font-bold text-[var(--upt-text-tertiary)] uppercase tracking-widest mb-4">Nueva Notificación</p>
          <input
            type="text"
            placeholder="Título de la notificación"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 mb-2.5 rounded-xl border border-[var(--upt-surface-border)] bg-[var(--upt-bg)] text-[var(--upt-text-primary)] text-sm font-semibold outline-none focus:border-[var(--upt-accent)]/40 focus:ring-4 focus:ring-[var(--upt-accent)]/5 transition-all"
          />
          <textarea
            placeholder="Escribe el mensaje para los estudiantes..."
            value={content}
            onChange={e => setContent(e.target.value)}
            required
            rows={4}
            className="w-full px-3.5 py-2.5 mb-3.5 rounded-xl border border-[var(--upt-surface-border)] bg-[var(--upt-bg)] text-[var(--upt-text-primary)] text-[13px] leading-relaxed outline-none resize-y focus:border-[var(--upt-accent)]/40 focus:ring-4 focus:ring-[var(--upt-accent)]/5 transition-all"
          />

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="flex items-center gap-2 flex-1 px-3.5 py-2.5 rounded-xl bg-[var(--upt-gold)]/[0.04] border border-[var(--upt-gold)]/12">
              <AlertCircle size={13} className="text-[var(--upt-gold)] shrink-0" />
               <p className="text-xs text-[var(--upt-text-secondary)]">
                La notificación será visible inmediatamente para todos los usuarios.
               </p>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-none bg-[var(--upt-accent)] text-white text-[13px] font-bold cursor-pointer shrink-0 shadow-[0_3px_12px_rgba(59,130,246,0.3)] transition-all duration-200 disabled:opacity-60 hover:bg-[var(--upt-accent-dark)]"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Publicar
            </button>
          </div>
        </form>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 size={28} className="text-[var(--upt-accent)] animate-spin" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-10 opacity-40">
            <Megaphone size={42} className="text-[var(--upt-text-tertiary)] mx-auto mb-3" />
            <p className="text-sm text-[var(--upt-text-secondary)]">Aún no has publicado ninguna notificación.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5" style={{ animation: 'fade-up 0.3s ease-out 0.1s both' }}>
            {announcements.map(ann => (
              <div key={ann.id} className="bg-[var(--upt-surface)] rounded-xl border border-[var(--upt-surface-border)] px-5 py-4 shadow-sm flex items-start justify-between gap-3.5 group hover:border-[var(--upt-surface-border)] transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <p className="text-sm font-bold text-[var(--upt-text-primary)]">{ann.title}</p>
                    <span className="text-[11px] text-[var(--upt-text-tertiary)] shrink-0">
                      {ann.created_at ? new Date(ann.created_at).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <p className="text-[13px] text-[var(--upt-text-secondary)] leading-relaxed">{ann.content}</p>
                </div>
                <button
                  onClick={() => handleDelete(ann.id)}
                  className="w-8 h-8 rounded-lg border-none bg-transparent cursor-pointer shrink-0 flex items-center justify-center text-[var(--upt-text-tertiary)] transition-all duration-150 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-[var(--upt-error)]/10 hover:text-[var(--upt-error)]"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
