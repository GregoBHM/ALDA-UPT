import { useState, useEffect } from 'react';
import { Code2, Target, ChevronRight, Loader2, LayoutGrid, Filter, X, BookOpen, Play, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { getLabs, getProgress } from '../../api';

// Same key resolver as PracticeRoom so auto-selection works correctly
function getUserLabKey() {
  try {
    const u = JSON.parse(sessionStorage.getItem('user') || '{}');
    const uid = u.id || 'guest';
    return `alda_lab_${uid}`;
  } catch {
    return 'alda_active_lab';
  }
}

export default function ChallengesCatalog() {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedLab, setSelectedLab] = useState(null);
  const [solvedLabIds, setSolvedLabIds] = useState(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [labsData] = await Promise.all([getLabs()]);
        setLabs(labsData);

        // Cargar progreso del estudiante para marcar labs completados
        const user = JSON.parse(sessionStorage.getItem('user') || '{}');
        if (user?.email) {
          try {
            const progress = await getProgress(user.email);
            // recent_activity contiene los intentos; detectar labs aprobados
            const solved = new Set(
              (progress.recent_activity || [])
                .filter(a => a.is_passed)
                .map(a => a.laboratory_id)
                .filter(Boolean)
            );
            setSolvedLabIds(solved);
          } catch {}
        }
      } catch (error) {
        console.error('Error fetching labs', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredLabs = labs.filter(lab => filter === 'all' || lab.difficulty === filter);

  const handleGoToPractice = (lab) => {
    // Save under user-scoped key so PracticeRoom auto-selects the lab
    const userKey = getUserLabKey();
    localStorage.setItem(userKey, lab.id);
    // Also keep the legacy keys for compatibility
    localStorage.setItem('alda_active_lab', lab.id);
    sessionStorage.setItem('alda_active_lab', lab.id);
    setSelectedLab(null);
    window.dispatchEvent(new CustomEvent('alda:navigate', { detail: 'practice' }));
  };

  const difficultyConfig = {
    easy:   { label: 'Fácil',   tw: 'bg-[var(--upt-success)]/10 text-[var(--upt-success)] border-[var(--upt-success)]/20' },
    medium: { label: 'Medio',   tw: 'bg-[var(--upt-warning)]/10 text-[var(--upt-warning)] border-[var(--upt-warning)]/20' },
    hard:   { label: 'Difícil', tw: 'bg-[var(--upt-error)]/10 text-[var(--upt-error)] border-[var(--upt-error)]/20' },
  };

  if (loading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <Loader2 size={32} className="text-[var(--upt-accent)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-y-auto bg-[var(--upt-bg)]">
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1280px] mx-auto">

        <div className="flex flex-wrap items-end justify-between gap-4 mb-8" style={{ animation: 'fade-up 0.4s ease-out' }}>
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <div className="w-10 h-10 rounded-xl bg-[var(--upt-accent)]/10 border border-[var(--upt-accent)]/15 flex items-center justify-center">
                <LayoutGrid size={20} className="text-[var(--upt-accent)]" />
              </div>
              <h2 className="text-[22px] font-extrabold text-[var(--upt-text-primary)] tracking-tight">Catálogo de Retos</h2>
            </div>
            <p className="text-sm text-[var(--upt-text-secondary)]">
              Explora todos los desafíos creados por los docentes y pon a prueba tu lógica.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[var(--upt-surface)] px-3.5 py-2 rounded-xl border border-[var(--upt-surface-border)] shadow-sm">
            <Filter size={14} className="text-[var(--upt-text-tertiary)]" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-transparent border-none outline-none text-[13px] font-semibold text-[var(--upt-text-primary)] cursor-pointer"
              style={{ colorScheme: 'inherit' }}
            >
              <option value="all">Todas las Dificultades</option>
              <option value="easy">Fáciles</option>
              <option value="medium">Medios</option>
              <option value="hard">Difíciles</option>
            </select>
          </div>
        </div>

        {filteredLabs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
            <Target size={56} className="text-[var(--upt-text-tertiary)] mb-4" />
            <h3 className="text-lg font-bold text-[var(--upt-text-primary)] mb-1.5">Sin retos disponibles</h3>
            <p className="text-sm text-[var(--upt-text-secondary)]">Intenta con otro filtro de dificultad.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4" style={{ animation: 'fade-up 0.4s ease-out 0.05s both' }}>
            {filteredLabs.map(lab => {
              const diff = difficultyConfig[lab.difficulty] || difficultyConfig.medium;
              const isSolved = solvedLabIds.has(lab.id);
              return (
                <div
                  key={lab.id}
                  onClick={() => setSelectedLab(lab)}
                  className={`bg-[var(--upt-surface)] border rounded-2xl p-6 cursor-pointer flex flex-col transition-all duration-200 shadow-sm hover:shadow-[var(--upt-shadow-md)] hover:-translate-y-0.5 group relative overflow-hidden ${
                    isSolved
                      ? 'border-[var(--upt-success)]/40 hover:border-[var(--upt-success)]/60'
                      : 'border-[var(--upt-surface-border)] hover:border-[var(--upt-accent)]/25'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-[var(--upt-bg)] border border-[var(--upt-surface-border)] flex items-center justify-center shrink-0">
                      {isSolved
                        ? <CheckCircle2 size={22} className="text-[var(--upt-success)]" />
                        : <Code2 size={22} className="text-[var(--upt-text-tertiary)] group-hover:text-[var(--upt-accent)] transition-colors" />
                      }
                    </div>
                    <div className="flex items-center gap-2">
                      {isSolved && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--upt-success)]/10 text-[var(--upt-success)] border border-[var(--upt-success)]/20 uppercase tracking-wider">
                          ✓ Completado
                        </span>
                      )}
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${diff.tw}`}>
                        {diff.label}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-[15px] font-bold text-[var(--upt-text-primary)] mb-2 leading-tight">{lab.title}</h3>
                  <p className="text-[13px] text-[var(--upt-text-secondary)] mb-5 leading-relaxed flex-1 line-clamp-2">{lab.description}</p>

                  <div className="flex items-center justify-between pt-4 border-t border-[var(--upt-surface-border)]">
                    <span className="text-xs text-[var(--upt-text-tertiary)] font-medium">{lab.teacher_name}</span>
                    <span className="text-xs text-[var(--upt-accent)] font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                      Ver reto <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedLab && (
        <div
          onClick={() => setSelectedLab(null)}
          className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-6"
          style={{ animation: 'fade-in 0.15s ease' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-[var(--upt-surface)] rounded-2xl border border-[var(--upt-surface-border)] shadow-[var(--upt-shadow-lg)] w-full max-w-[580px] overflow-hidden"
            style={{ animation: 'scale-in 0.18s ease' }}
          >
            <div className="px-7 py-6 border-b border-[var(--upt-surface-border)] flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl shrink-0 bg-[var(--upt-accent)]/[0.08] border border-[var(--upt-accent)]/15 flex items-center justify-center">
                  <BookOpen size={22} className="text-[var(--upt-accent)]" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[var(--upt-text-primary)] mb-1 tracking-tight">{selectedLab.title}</h3>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const d = difficultyConfig[selectedLab.difficulty] || difficultyConfig.medium;
                      return (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${d.tw}`}>
                          {d.label}
                        </span>
                      );
                    })()}
                    <span className="text-xs text-[var(--upt-text-tertiary)]">por {selectedLab.teacher_name}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedLab(null)}
                className="w-8 h-8 rounded-lg shrink-0 border border-[var(--upt-surface-border)] bg-[var(--upt-bg)] flex items-center justify-center cursor-pointer text-[var(--upt-text-tertiary)] hover:text-[var(--upt-text-primary)] hover:bg-[var(--upt-surface-light)] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-7 py-6">
              <p className="text-sm text-[var(--upt-text-secondary)] leading-[1.75] mb-6 whitespace-pre-wrap">{selectedLab.description}</p>

              <div className="flex items-center gap-2 p-3.5 rounded-xl bg-[var(--upt-accent)]/[0.05] border border-[var(--upt-accent)]/10 mb-6">
                <ShieldCheck size={15} className="text-[var(--upt-accent)] shrink-0" />
                <p className="text-xs text-[var(--upt-text-secondary)]">
                  Tu código será evaluado contra casos de prueba definidos por el docente.
                </p>
              </div>

              <button
                onClick={() => handleGoToPractice(selectedLab)}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border-none bg-[var(--upt-accent)] text-white text-sm font-bold cursor-pointer shadow-[0_4px_14px_rgba(59,130,246,0.35)] transition-all duration-200 hover:bg-[var(--upt-accent-dark)] hover:-translate-y-0.5"
              >
                <Play size={16} />
                Ir a la Sala de Práctica
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
