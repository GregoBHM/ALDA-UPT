import { useState, useEffect } from 'react';
import { Plus, FileText, TestTube2, Save, X, Trash2, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function LabManager() {
  const [labs, setLabs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // States for new lab form
  const [showLabForm, setShowLabForm] = useState(false);
  const [labTitle, setLabTitle] = useState('');
  const [labDesc, setLabDesc] = useState('');
  const [labDifficulty, setLabDifficulty] = useState('medium');
  const [testCases, setTestCases] = useState([{ input_data: '', expected_output: '', is_hidden: false }]);

  const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/teacher/labs`, { headers: { 'X-User-ID': currentUser.id } });
      if (res.ok) {
        setLabs(await res.json());
      }
    } catch {
      toast.error('Error al cargar datos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTestCase = () => {
    setTestCases([...testCases, { input_data: '', expected_output: '', is_hidden: false }]);
  };

  const handleTestCaseChange = (index, field, value) => {
    const newTestCases = [...testCases];
    newTestCases[index][field] = value;
    setTestCases(newTestCases);
  };

  const handleRemoveTestCase = (index) => {
    const newTestCases = testCases.filter((_, i) => i !== index);
    setTestCases(newTestCases);
  };

  const handleCreateLab = async (e) => {
    e.preventDefault();
    if (!labTitle) return toast.error('El título es requerido');
    
    try {
      const res = await fetch(`${API_BASE}/api/teacher/labs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-ID': currentUser.id },
        body: JSON.stringify({
          title: labTitle,
          description: labDesc,
          difficulty: labDifficulty,
          test_cases: testCases.filter(tc => tc.expected_output.trim() !== '')
        })
      });
      if (res.ok) {
        toast.success('Reto creado exitosamente');
        setShowLabForm(false);
        setLabTitle(''); setLabDesc(''); setLabDifficulty('medium'); setTestCases([{ input_data: '', expected_output: '', is_hidden: false }]);
        fetchData();
      } else {
        toast.error('Error al crear reto');
      }
    } catch {
      toast.error('Error de red');
    }
  };

  const handleDeleteLab = async (labId, e) => {
    e.stopPropagation();
    if (!window.confirm('¿Estás seguro de eliminar este reto? Todos los intentos de alumnos se perderán.')) return;
    try {
      const res = await fetch(`${API_BASE}/api/teacher/labs/${labId}`, {
        method: 'DELETE',
        headers: { 'X-User-ID': currentUser.id }
      });
      if (res.ok) {
        toast.success('Reto eliminado');
        fetchData();
      } else {
        toast.error('Error al eliminar reto');
      }
    } catch {
      toast.error('Error de red');
    }
  };

  return (
    <div className="p-6 lg:p-8 overflow-y-auto h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[22px] font-extrabold text-[var(--upt-text-primary)] tracking-tight">Gestión de Retos y Laboratorios</h1>
          <p className="text-[var(--upt-text-tertiary)] text-sm mt-1">Crea desafíos de programación con casos de prueba para los alumnos.</p>
        </div>
        <button onClick={() => setShowLabForm(!showLabForm)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[var(--upt-gold)] to-amber-500 text-[var(--upt-navy)] rounded-xl text-sm font-bold hover:shadow-lg transition-all">
          {showLabForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showLabForm ? 'Cancelar' : 'Nuevo Reto'}
        </button>
      </div>

      {showLabForm && (
        <form onSubmit={handleCreateLab} className="mb-8 p-6 rounded-2xl bg-[var(--upt-surface)] border border-white/10 shadow-xl">
          <h3 className="text-lg font-bold text-[var(--upt-text-primary)] mb-4">Crear Nuevo Reto</h3>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-[3]">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-[var(--upt-text-tertiary)] mb-2">Título del Reto</label>
              <input type="text" value={labTitle} onChange={e => setLabTitle(e.target.value)} placeholder="Ej: Validar un Número Primo" className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-sm text-[var(--upt-text-primary)]" />
            </div>
            <div className="flex-[1]">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-[var(--upt-text-tertiary)] mb-2">Dificultad</label>
              <select value={labDifficulty} onChange={e => setLabDifficulty(e.target.value)} className="w-full bg-[#1e2333] border border-white/10 rounded-xl py-2 px-4 text-sm text-[var(--upt-text-primary)]">
                <option value="easy">Fácil</option>
                <option value="medium">Media</option>
                <option value="hard">Difícil</option>
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-[11px] font-bold uppercase tracking-widest text-[var(--upt-text-tertiary)] mb-2">Instrucciones / Lógica Esperada</label>
            <textarea value={labDesc} onChange={e => setLabDesc(e.target.value)} rows="3" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white resize-none" placeholder="Escribe un programa que reciba..." />
          </div>
          
          <div className="mb-6 p-5 border border-indigo-500/30 bg-black/20 rounded-xl">
            <div className="flex justify-between items-center mb-4">
              <label className="block text-xs font-bold text-[var(--upt-text-tertiary)] flex items-center gap-2 uppercase tracking-widest">
                <TestTube2 className="w-4 h-4 text-indigo-400" /> Casos de Prueba (Validación)
              </label>
              <button type="button" onClick={handleAddTestCase} className="text-xs text-[var(--upt-gold)] hover:text-amber-400 font-bold flex items-center gap-1">+ Añadir Caso</button>
            </div>
            
            {testCases.map((tc, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-3 items-stretch sm:items-center bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="flex-1">
                  <input type="text" placeholder="Entrada (stdin)" value={tc.input_data} onChange={e => handleTestCaseChange(idx, 'input_data', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white font-mono" />
                </div>
                <div className="flex-1">
                  <input type="text" placeholder="Salida Esperada (stdout)" value={tc.expected_output} onChange={e => handleTestCaseChange(idx, 'expected_output', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white font-mono" />
                </div>
                <label className="flex items-center gap-2 text-[11px] text-white/70 cursor-pointer select-none">
                  <input type="checkbox" checked={tc.is_hidden} onChange={e => handleTestCaseChange(idx, 'is_hidden', e.target.checked)} className="rounded border-white/20 bg-black/50 text-[var(--upt-gold)] focus:ring-[var(--upt-gold)] focus:ring-offset-0" /> Oculto
                </label>
                <button type="button" onClick={() => handleRemoveTestCase(idx)} className="p-2 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            <p className="text-[10px] text-white/40 mt-2 italic">Deja la entrada en blanco si el programa no requiere input del usuario (ej: un simple "Hola Mundo").</p>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowLabForm(false)} className="px-5 py-2.5 text-sm font-bold text-white/60 hover:text-white transition-colors">Cancelar</button>
            <button type="submit" className="px-6 py-2.5 bg-indigo-500 text-white text-sm font-bold rounded-xl hover:bg-indigo-400 flex items-center gap-2 shadow-lg hover:shadow-indigo-500/25 transition-all"><Save className="w-4 h-4" /> Guardar Reto</button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="animate-pulse flex gap-4"><div className="h-20 w-full bg-white/5 rounded-2xl"></div></div>
      ) : labs.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
            <FileText className="w-8 h-8 text-white/20" />
          </div>
          <h3 className="text-lg font-bold text-white/80 mb-1">No hay retos creados</h3>
          <p className="text-sm text-white/40 max-w-md">Comienza creando tu primer desafío de programación para que los alumnos puedan practicar con ALDA.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {labs.map(lab => (
            <div key={lab.id} className="bg-[var(--upt-surface)] rounded-2xl border border-white/8 shadow-lg p-5 flex flex-col md:flex-row gap-4 md:items-center justify-between group hover:border-white/20 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--upt-navy)] flex items-center justify-center shrink-0 border border-white/10 shadow-inner">
                  <FileText className="w-6 h-6 text-[var(--upt-gold)]" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-[var(--upt-text-primary)] text-lg">{lab.title}</h3>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border 
                      ${lab.difficulty === 'easy' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 
                        lab.difficulty === 'hard' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 
                        'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                      {lab.difficulty === 'easy' ? 'Fácil' : lab.difficulty === 'hard' ? 'Difícil' : 'Media'}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--upt-text-secondary)] mt-1 max-w-3xl line-clamp-2">{lab.description}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 justify-between md:justify-end border-t border-white/5 md:border-0 pt-4 md:pt-0">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--upt-text-tertiary)] bg-black/20 px-3 py-1.5 rounded-lg">
                  <TestTube2 className="w-4 h-4 text-indigo-400" />
                  {lab.test_cases.length} Casos
                </div>
                <button onClick={(e) => handleDeleteLab(lab.id, e)} className="p-2.5 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 rounded-xl transition-all shadow-sm" title="Eliminar Reto">
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
