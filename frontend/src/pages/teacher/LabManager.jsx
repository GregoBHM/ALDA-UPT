import { useState, useEffect } from 'react';
import { Plus, FileText, TestTube2, Save, X, Trash2, Pencil, Brain, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const EVAL_TYPES = [
  { value: 'exact', label: 'Exacta', desc: 'El output debe ser idéntico (con sanitización de espacios).' },
  { value: 'regex', label: 'Expresión Regular', desc: 'El output debe coincidir con el patrón (ej: (?i)resultado.*8).' },
  { value: 'ai_semantic', label: '🤖 Flexible (IA Juez)', desc: 'ALDA decide si el output es lógicamente correcto, sin importar el formato de texto.' },
];

const EMPTY_TC = { input_data: '', expected_output: '', is_hidden: false, evaluation_type: 'exact' };

function LabForm({ initial, onSave, onCancel, isEditing }) {
  const [labTitle, setLabTitle] = useState(initial?.title || '');
  const [labDesc, setLabDesc] = useState(initial?.description || '');
  const [labDifficulty, setLabDifficulty] = useState(initial?.difficulty || 'medium');
  const [isExam, setIsExam] = useState(initial?.is_exam || false);
  const [testCases, setTestCases] = useState(
    initial?.test_cases?.length > 0
      ? initial.test_cases.map(tc => ({ ...EMPTY_TC, ...tc }))
      : [{ ...EMPTY_TC }]
  );
  const [expandedEvalInfo, setExpandedEvalInfo] = useState(null);

  const handleTCChange = (idx, field, value) => {
    const next = [...testCases];
    next[idx] = { ...next[idx], [field]: value };
    setTestCases(next);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!labTitle.trim()) return toast.error('El título es requerido');
    onSave({ title: labTitle, description: labDesc, difficulty: labDifficulty, is_exam: isExam, test_cases: testCases.filter(tc => tc.expected_output.trim() !== '') });
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 p-6 rounded-2xl bg-[var(--upt-surface)] border border-[var(--upt-surface-border)] shadow-xl">
      <h3 className="text-lg font-bold text-[var(--upt-text-primary)] mb-5">
        {isEditing ? '✏️ Editar Reto' : 'Crear Nuevo Reto'}
      </h3>

      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="flex-[3]">
          <label className="block text-[11px] font-bold uppercase tracking-widest text-[var(--upt-text-tertiary)] mb-2">Título del Reto</label>
          <input type="text" value={labTitle} onChange={e => setLabTitle(e.target.value)} placeholder="Ej: Verificar Número Primo"
            className="w-full bg-[var(--upt-surface-light)] border border-[var(--upt-surface-border)] rounded-xl py-2 px-4 text-sm text-[var(--upt-text-primary)]" />
        </div>
        <div className="flex-[1]">
          <label className="block text-[11px] font-bold uppercase tracking-widest text-[var(--upt-text-tertiary)] mb-2">Dificultad</label>
          <select value={labDifficulty} onChange={e => setLabDifficulty(e.target.value)}
            className="w-full bg-[var(--upt-bg-deep)] border border-[var(--upt-surface-border)] rounded-xl py-2 px-4 text-sm text-[var(--upt-text-primary)]">
            <option value="easy">Fácil</option>
            <option value="medium">Media</option>
            <option value="hard">Difícil</option>
          </select>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-[11px] font-bold uppercase tracking-widest text-[var(--upt-text-tertiary)] mb-2">Instrucciones / Enunciado</label>
        <textarea value={labDesc} onChange={e => setLabDesc(e.target.value)} rows="3"
          className="w-full bg-[var(--upt-surface-light)] border border-[var(--upt-surface-border)] rounded-xl py-3 px-4 text-sm text-[var(--upt-text-primary)] resize-none"
          placeholder="Describe el problema. ALDA usará esto para guiar al alumno contextualmente." />
      </div>

      <label className="flex items-center gap-2 mb-6 cursor-pointer select-none w-fit">
        <input type="checkbox" checked={isExam} onChange={e => setIsExam(e.target.checked)}
          className="rounded border-[var(--upt-surface-border)] bg-[var(--upt-bg-deep)] text-[var(--upt-gold)]" />
        <span className="text-xs font-bold text-[var(--upt-text-secondary)]">Modo Examen <span className="opacity-60 font-normal">(bloquea el asistente ALDA)</span></span>
      </label>

      <div className="mb-6 p-5 border border-[var(--upt-accent)]/30 bg-[var(--upt-bg-deep)] rounded-xl">
        <div className="flex justify-between items-center mb-4">
          <label className="text-xs font-bold text-[var(--upt-text-tertiary)] flex items-center gap-2 uppercase tracking-widest">
            <TestTube2 className="w-4 h-4 text-[var(--upt-accent-light)]" /> Casos de Prueba
          </label>
          <button type="button" onClick={() => setTestCases([...testCases, { ...EMPTY_TC }])}
            className="text-xs text-[var(--upt-gold)] hover:text-[var(--upt-warning)] font-bold flex items-center gap-1">+ Añadir Caso</button>
        </div>

        {testCases.map((tc, idx) => (
          <div key={idx} className="mb-4 bg-[var(--upt-surface-light)] p-4 rounded-xl border border-[var(--upt-surface-border)]">
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--upt-text-tertiary)] mb-1">Entrada (stdin)</p>
                <input type="text" placeholder="Ej: 5\n3" value={tc.input_data}
                  onChange={e => handleTCChange(idx, 'input_data', e.target.value)}
                  className="w-full bg-[var(--upt-bg-deep)] border border-[var(--upt-surface-border)] rounded-lg p-2.5 text-xs text-[var(--upt-text-primary)] font-mono" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--upt-text-tertiary)] mb-1">Salida Esperada</p>
                <input type="text" placeholder="Ej: 8" value={tc.expected_output}
                  onChange={e => handleTCChange(idx, 'expected_output', e.target.value)}
                  className="w-full bg-[var(--upt-bg-deep)] border border-[var(--upt-surface-border)] rounded-lg p-2.5 text-xs text-[var(--upt-text-primary)] font-mono" />
              </div>
              <button type="button" onClick={() => setTestCases(testCases.filter((_, i) => i !== idx))}
                className="p-2 self-end text-[var(--upt-error)] hover:bg-[var(--upt-error)]/20 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-1.5 text-[11px] text-[var(--upt-text-secondary)] cursor-pointer select-none">
                <input type="checkbox" checked={tc.is_hidden} onChange={e => handleTCChange(idx, 'is_hidden', e.target.checked)}
                  className="rounded border-[var(--upt-surface-border)] bg-[var(--upt-bg-deep)] text-[var(--upt-gold)]" />
                {tc.is_hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                Oculto
              </label>

              <div className="flex items-center gap-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--upt-text-tertiary)]">Evaluación:</p>
                <div className="flex gap-1.5">
                  {EVAL_TYPES.map(et => (
                    <button key={et.value} type="button"
                      onClick={() => handleTCChange(idx, 'evaluation_type', et.value)}
                      title={et.desc}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${tc.evaluation_type === et.value
                        ? 'bg-[var(--upt-gold)]/15 border-[var(--upt-gold)]/40 text-[var(--upt-gold)]'
                        : 'bg-[var(--upt-bg-deep)] border-[var(--upt-surface-border)] text-[var(--upt-text-tertiary)] hover:border-[var(--upt-gold)]/30'}`}>
                      {et.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {tc.evaluation_type === 'ai_semantic' && (
              <div className="mt-2 flex items-start gap-2 text-[11px] text-[var(--upt-gold)] bg-[var(--upt-gold)]/5 border border-[var(--upt-gold)]/20 rounded-lg px-3 py-2">
                <Brain className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>ALDA evaluará si el output del alumno es lógicamente equivalente al esperado, sin importar el formato de texto extra.</span>
              </div>
            )}
            {tc.evaluation_type === 'regex' && (
              <div className="mt-2 text-[11px] text-[var(--upt-text-tertiary)] bg-[var(--upt-surface)] border border-[var(--upt-surface-border)] rounded-lg px-3 py-2">
                ⚠ La "Salida Esperada" será tratada como un patrón de Expresión Regular Python.
              </div>
            )}
          </div>
        ))}
        <p className="text-[10px] text-[var(--upt-text-tertiary)] mt-2 italic">Deja la entrada en blanco si el programa no requiere input.</p>
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="px-5 py-2.5 text-sm font-bold text-[var(--upt-text-secondary)] hover:text-[var(--upt-text-primary)] transition-colors">Cancelar</button>
        <button type="submit" className="px-6 py-2.5 bg-[var(--upt-accent)] text-white text-sm font-bold rounded-xl hover:bg-[var(--upt-accent-light)] flex items-center gap-2 shadow-lg transition-all">
          <Save className="w-4 h-4" /> {isEditing ? 'Guardar Cambios' : 'Crear Reto'}
        </button>
      </div>
    </form>
  );
}

export default function LabManager() {
  const [labs, setLabs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLab, setEditingLab] = useState(null);

  const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/teacher/labs`, { headers: { 'X-User-ID': currentUser.id } });
      if (res.ok) setLabs(await res.json());
    } catch { toast.error('Error al cargar datos'); }
    finally { setIsLoading(false); }
  };

  const handleCreate = async (data) => {
    try {
      const res = await fetch(`${API_BASE}/api/teacher/labs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-ID': currentUser.id },
        body: JSON.stringify(data),
      });
      if (res.ok) { toast.success('Reto creado'); setShowForm(false); fetchData(); }
      else { const e = await res.json(); toast.error(e.detail || 'Error al crear reto'); }
    } catch { toast.error('Error de red'); }
  };

  const handleUpdate = async (data) => {
    try {
      const res = await fetch(`${API_BASE}/api/teacher/labs/${editingLab.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-User-ID': currentUser.id },
        body: JSON.stringify(data),
      });
      if (res.ok) { toast.success('Reto actualizado'); setEditingLab(null); fetchData(); }
      else { const e = await res.json(); toast.error(e.detail || 'Error al actualizar'); }
    } catch { toast.error('Error de red'); }
  };

  const handleDelete = async (labId, e) => {
    e.stopPropagation();
    if (!window.confirm('¿Estás seguro de eliminar este reto? Se perderán todos los intentos.')) return;
    try {
      const res = await fetch(`${API_BASE}/api/teacher/labs/${labId}`, { method: 'DELETE', headers: { 'X-User-ID': currentUser.id } });
      if (res.ok) { toast.success('Reto eliminado'); fetchData(); }
      else toast.error('Error al eliminar reto');
    } catch { toast.error('Error de red'); }
  };

  const evalBadge = (tc) => {
    if (tc.evaluation_type === 'ai_semantic') return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--upt-gold)]/10 text-[var(--upt-gold)] border border-[var(--upt-gold)]/20">🤖 IA Juez</span>;
    if (tc.evaluation_type === 'regex') return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--upt-accent)]/10 text-[var(--upt-accent-light)] border border-[var(--upt-accent)]/20">RegEx</span>;
    return null;
  };

  return (
    <div className="p-6 lg:p-8 overflow-y-auto h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[22px] font-extrabold text-[var(--upt-text-primary)] tracking-tight">Gestión de Retos y Laboratorios</h1>
          <p className="text-[var(--upt-text-tertiary)] text-sm mt-1">Crea y edita desafíos con evaluación exacta, por expresión regular o con Juez IA.</p>
        </div>
        {!editingLab && (
          <button onClick={() => { setShowForm(!showForm); setEditingLab(null); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[var(--upt-gold)] to-[var(--upt-gold-light)] text-[var(--upt-navy)] rounded-xl text-sm font-bold hover:shadow-lg transition-all">
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Cancelar' : 'Nuevo Reto'}
          </button>
        )}
      </div>

      {showForm && !editingLab && (
        <LabForm onSave={handleCreate} onCancel={() => setShowForm(false)} isEditing={false} />
      )}

      {editingLab && (
        <LabForm initial={editingLab} onSave={handleUpdate} onCancel={() => setEditingLab(null)} isEditing={true} />
      )}

      {isLoading ? (
        <div className="animate-pulse flex gap-4"><div className="h-20 w-full bg-[var(--upt-surface-light)] rounded-2xl"></div></div>
      ) : labs.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--upt-surface-light)] flex items-center justify-center mb-4 border border-[var(--upt-surface-border)]">
            <FileText className="w-8 h-8 text-[var(--upt-text-tertiary)]/50" />
          </div>
          <h3 className="text-lg font-bold text-[var(--upt-text-primary)] mb-1">No hay retos creados</h3>
          <p className="text-sm text-[var(--upt-text-tertiary)] max-w-md">Comienza creando tu primer desafío de programación.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {labs.map(lab => (
            <div key={lab.id} className="bg-[var(--upt-surface)] rounded-2xl border border-[var(--upt-surface-border)] shadow-lg p-5 flex flex-col md:flex-row gap-4 md:items-center justify-between group hover:border-[var(--upt-gold)]/20 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--upt-navy)] flex items-center justify-center shrink-0 border border-[var(--upt-surface-border)] shadow-inner">
                  <FileText className="w-6 h-6 text-[var(--upt-gold)]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-[var(--upt-text-primary)] text-base">{lab.title}</h3>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border
                      ${lab.difficulty === 'easy' ? 'bg-[var(--upt-success)]/10 border-[var(--upt-success)]/20 text-[var(--upt-success)]' :
                        lab.difficulty === 'hard' ? 'bg-[var(--upt-error)]/10 border-[var(--upt-error)]/20 text-[var(--upt-error)]' :
                        'bg-[var(--upt-warning)]/10 border-[var(--upt-warning)]/20 text-[var(--upt-warning)]'}`}>
                      {lab.difficulty === 'easy' ? 'Fácil' : lab.difficulty === 'hard' ? 'Difícil' : 'Media'}
                    </span>
                    {lab.is_exam && <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[var(--upt-error)]/10 border border-[var(--upt-error)]/20 text-[var(--upt-error)]">EXAMEN</span>}
                  </div>
                  <p className="text-sm text-[var(--upt-text-secondary)] mt-1 line-clamp-2">{lab.description}</p>
                  {lab.test_cases?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {lab.test_cases.map((tc, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <span className="text-[10px] text-[var(--upt-text-tertiary)] font-mono bg-[var(--upt-bg-deep)] px-1.5 py-0.5 rounded">
                            {tc.is_hidden ? '🔒' : '👁'} Caso {i + 1}
                          </span>
                          {evalBadge(tc)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 justify-between md:justify-end border-t border-[var(--upt-surface-border)] md:border-0 pt-4 md:pt-0 shrink-0">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--upt-text-tertiary)] bg-[var(--upt-bg-deep)] px-3 py-1.5 rounded-lg">
                  <TestTube2 className="w-4 h-4 text-[var(--upt-accent-light)]" />
                  {lab.test_cases.length} Casos
                </div>
                <button onClick={() => { setEditingLab(lab); setShowForm(false); }}
                  className="p-2.5 text-[var(--upt-gold)] hover:bg-[var(--upt-gold)]/10 rounded-xl transition-all" title="Editar Reto">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={(e) => handleDelete(lab.id, e)}
                  className="p-2.5 text-[var(--upt-error)] hover:bg-[var(--upt-error)]/20 rounded-xl transition-all" title="Eliminar Reto">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
