import { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Trash2, Loader2, Mail, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAllowedEmails, addAllowedEmail, removeAllowedEmail } from '../../api';

export default function AllowedEmails() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');

  const fetchEntries = async () => {
    try {
      const data = await getAllowedEmails(user.id);
      setEntries(data);
    } catch {
      toast.error('No se pudo cargar la lista.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEntries(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      await addAllowedEmail(user.id, email.trim(), note.trim() || null);
      toast.success('Correo añadido correctamente.');
      setEmail('');
      setNote('');
      fetchEntries();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (targetEmail) => {
    try {
      await removeAllowedEmail(user.id, targetEmail);
      toast.success('Correo eliminado.');
      setEntries(prev => prev.filter(e => e.email !== targetEmail));
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="absolute inset-0 overflow-y-auto bg-[var(--upt-bg)]">
      <div className="p-4 sm:p-6 lg:p-8 max-w-[860px] mx-auto">

        <div className="flex items-center gap-3 mb-2" style={{ animation: 'fade-up 0.4s ease-out' }}>
          <div className="w-10 h-10 rounded-lg bg-[var(--upt-surface)] border border-[var(--upt-surface-border)] flex items-center justify-center">
            <ShieldCheck size={18} className="text-[var(--upt-gold)]" />
          </div>
          <div>
            <h2 className="text-[20px] font-bold text-[var(--upt-text-primary)] tracking-tight">Accesos Especiales</h2>
            <p className="text-[13px] text-[var(--upt-text-tertiary)] mt-0.5">Correos autorizados fuera del dominio institucional.</p>
          </div>
        </div>

        <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-[var(--upt-gold)]/[0.04] border border-[var(--upt-gold)]/12 mb-7 mt-5" style={{ animation: 'fade-up 0.4s ease-out 0.05s both' }}>
          <AlertCircle size={15} className="text-[var(--upt-gold)] shrink-0 mt-0.5" />
          <p className="text-xs text-[var(--upt-text-secondary)] leading-relaxed">
            Los correos añadidos aquí podrán iniciar sesión en la plataforma aunque no sean del dominio <strong className="text-[var(--upt-text-primary)]">@virtual.upt.pe</strong>. Úsalo solo para cuentas de prueba o demostración.
          </p>
        </div>

        <form onSubmit={handleAdd} className="bg-[var(--upt-surface)] rounded-xl border border-[var(--upt-surface-border)] p-5 mb-6" style={{ animation: 'fade-up 0.4s ease-out 0.1s both' }}>
          <p className="text-[11px] font-semibold text-[var(--upt-text-tertiary)] uppercase tracking-wider mb-3">Añadir correo</p>
          <div className="flex gap-2.5 flex-wrap">
            <div className="flex-[2] min-w-[220px] relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--upt-text-tertiary)]" />
              <input
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full py-2.5 pl-9 pr-3 rounded-xl border border-[var(--upt-surface-border)] bg-[var(--upt-bg)] text-[var(--upt-text-primary)] text-[13px] outline-none focus:border-[var(--upt-gold)]/40 transition-all"
              />
            </div>
            <input
              type="text"
              placeholder="Nota (opcional)"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="flex-1 min-w-[160px] py-2.5 px-3 rounded-xl border border-[var(--upt-surface-border)] bg-[var(--upt-bg)] text-[var(--upt-text-primary)] text-[13px] outline-none focus:border-[var(--upt-gold)]/40 transition-all"
            />
            <button type="submit" disabled={submitting}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[var(--upt-accent)] hover:bg-[var(--upt-accent-light)] text-white text-[13px] font-semibold cursor-pointer transition-colors disabled:opacity-40">
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Añadir
            </button>
          </div>
        </form>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 size={28} className="text-[var(--upt-accent)] animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-10 opacity-50">
            <ShieldCheck size={40} className="text-[var(--upt-text-tertiary)] mx-auto mb-3" />
            <p className="text-sm text-[var(--upt-text-secondary)]">No hay correos autorizados aún.</p>
          </div>
        ) : (
          <div className="bg-[var(--upt-surface)] rounded-2xl border border-[var(--upt-surface-border)] overflow-hidden shadow-sm" style={{ animation: 'fade-up 0.3s ease-out 0.15s both' }}>
            {entries.map((entry, i) => (
              <div
                key={entry.email}
                className={`flex items-center justify-between px-5 py-3.5 gap-3 group hover:bg-[var(--upt-surface-light)]/40 transition-colors ${
                  i < entries.length - 1 ? 'border-b border-[var(--upt-surface-border)]' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg shrink-0 bg-[var(--upt-accent)]/[0.08] border border-[var(--upt-accent)]/12 flex items-center justify-center">
                    <Mail size={14} className="text-[var(--upt-accent)]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-[var(--upt-text-primary)] truncate">{entry.email}</p>
                    {entry.note && (
                      <p className="text-xs text-[var(--upt-text-tertiary)] mt-0.5">{entry.note}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(entry.email)}
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
