import { useState, useEffect, useRef } from 'react';
import EditorPanel from '../../components/ide/EditorPanel';
import ConsolePanel from '../../components/ide/ConsolePanel';
import SocraticPanel from '../../components/ide/SocraticPanel';
import { getLabs, runTests } from '../../api';
import TestResultsPanel from '../../components/ide/TestResultsPanel';
import { BookOpen, ChevronDown, CheckSquare, Lock, Info, X as CloseIcon, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const STORAGE_KEYS = {
  CODE: 'alda_saved_code',
  LANGUAGE: 'alda_saved_language',
  THEME: 'alda_editor_theme',
  CHAT: 'alda_chat_messages',
  LAB: 'alda_active_lab',
};

const DEFAULT_CODE = `#include <iostream>\n\nint main() {\n  for (int i = 1; i <= 10; i++) {\n    std::cout << "Hola Mundo\\n";\n  }\n  return 0;\n}`;

// Returns user-scoped storage keys so each account has its own private history
function getUserStorageKeys() {
  try {
    const u = JSON.parse(sessionStorage.getItem('user') || '{}');
    const uid = u.id || 'guest';
    return {
      CODE: `alda_code_${uid}`,
      LANGUAGE: `alda_lang_${uid}`,
      THEME: `alda_theme_${uid}`,
      CHAT: `alda_chat_${uid}`,
      LAB: `alda_lab_${uid}`,
    };
  } catch {
    return {
      CODE: 'alda_saved_code',
      LANGUAGE: 'alda_saved_language',
      THEME: 'alda_editor_theme',
      CHAT: 'alda_chat_messages',
      LAB: 'alda_active_lab',
    };
  }
}

export default function PracticeRoom() {
  const STORAGE_KEYS = getUserStorageKeys();
  const [isExecuting, setIsExecuting] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  const [labs, setLabs] = useState([]);
  const [activeLabId, setActiveLabId] = useState(() => localStorage.getItem(STORAGE_KEYS.LAB) || '');
  const [showLabSelector, setShowLabSelector] = useState(false);
  
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [showTestResults, setShowTestResults] = useState(false);
  const [showDescription, setShowDescription] = useState(false);

  const [code, setCode] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.CODE) || DEFAULT_CODE;
  });
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.LANGUAGE) || 'cpp';
  });
  const [editorTheme, setEditorTheme] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.THEME) || 'vs-dark';
  });
  const [consoleOutput, setConsoleOutput] = useState([]);
  const [chatMessages, setChatMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CHAT);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CHAT, JSON.stringify(chatMessages));
  }, [chatMessages]);

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, newLang);
    
    let defaultTemplate = "";
    if (newLang === 'cpp') {
      defaultTemplate = `#include <iostream>\n\nint main() {\n  std::cout << "Hola Mundo\\n";\n  return 0;\n}`;
    } else if (newLang === 'python') {
      defaultTemplate = `def main():\n    print("Hola Mundo")\n\nif __name__ == "__main__":\n    main()`;
    } else if (newLang === 'java') {
      defaultTemplate = `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hola Mundo");\n    }\n}`;
    } else if (newLang === 'javascript') {
      defaultTemplate = `console.log("Hola Mundo");`;
    }
    
    setCode(defaultTemplate);
    localStorage.setItem(STORAGE_KEYS.CODE, defaultTemplate);
  };

  useEffect(() => {
    const fetchLabs = async () => {
      try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user?.email) return;
        const data = await getLabs();
        setLabs(data);
      } catch (e) {
        console.error("Error fetching labs", e);
      }
    };
    fetchLabs();
  }, []);

  const wsRef = useRef(null);

  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const handleExecuteCode = () => {
    if (isExecuting) return;
    setIsExecuting(true);
    setConsoleOutput([]);
    
    if (wsRef.current) {
        wsRef.current.close();
    }

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8200';
    const wsUrl = apiUrl.replace(/^http/, 'ws') + '/api/student/ws/compile';
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
        const user = JSON.parse(sessionStorage.getItem('user'));
        ws.send(JSON.stringify({
            code: code,
            language: language,
            laboratory_id: activeLabId || null,
            user_id: user?.id || null
        }));
    };

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            setConsoleOutput(prev => [...prev, data]);
        } catch (e) {
            console.error("Error parsing WS message", e);
        }
    };

    ws.onerror = (err) => {
        setConsoleOutput(prev => [...prev, { type: 'error', text: '✖ Error de conexión interactiva.' }]);
        toast.error('Error de conexión interactiva', { position: 'bottom-right' });
    };

    ws.onclose = () => {
        setIsExecuting(false);
    };
  };

  const sendConsoleInput = (text) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(text);
          setConsoleOutput(prev => [...prev, { type: 'stdin', text: text + '\n' }]);
      }
  };

  const handleRunTests = async () => {
    if (!activeLabId || isTesting) return;
    
    setIsTesting(true);
    setShowTestResults(true);
    setTestResults(null);
    
    try {
      const data = await runTests(code, language, activeLabId);
      if (data.error === 'compilation') {
        setConsoleOutput([{ type: 'error', text: '✖ Error de compilación detectado durante la evaluación:\n' + data.message }]);
        setShowTestResults(false);
        toast.error('Error de compilación');
      } else if (data.error === 'no_tests') {
        setConsoleOutput([{ type: 'warning', text: 'ℹ️ ' + data.message }]);
        setShowTestResults(false);
        toast.error(data.message, { icon: 'ℹ️' });
      } else {
        setTestResults(data);
        if (data.all_passed) {
          toast.success('¡Reto completado! Pasaste todos los casos.', { icon: '🎉' });
        } else {
          toast.error(`Fallaron ${data.total_count - data.passed_count} casos de prueba.`);
        }
      }
    } catch (e) {
      console.error(e);
      toast.error('Error al ejecutar las pruebas');
      setShowTestResults(false);
    } finally {
      setIsTesting(false);
    }
  };

  const handleToggleAssistant = () => {
    if (activeLab?.is_exam) {
      toast.error('El asistente está bloqueado en modo Examen', { icon: '🔒' });
      return;
    }
    const next = !showAssistant;
    setShowAssistant(next);
    if (next && chatMessages.length === 0) {
      const welcome = [{
        id: 1,
        sender: 'ai',
        text: '¡Hola! Estoy aquí para ayudarte. Ejecuta tu código y cuéntame qué dificultad tienes.'
      }];
      setChatMessages(welcome);
    }
  };

  const handleToggleTheme = () => {
    const next = editorTheme === 'vs-dark' ? 'vs-light' : 'vs-dark';
    setEditorTheme(next);
    localStorage.setItem(STORAGE_KEYS.THEME, next);
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEYS.CODE, code);
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, language);
    toast.success('Código guardado correctamente', { 
      position: 'bottom-right',
      icon: '💾',
    });
  };

  const selectLab = (id) => {
    setActiveLabId(id);
    localStorage.setItem(STORAGE_KEYS.LAB, id);
    setShowLabSelector(false);
    
    if (id !== '') {
      setShowAssistant(false);
    }
    
    toast.success(id === '' ? 'Entraste a Práctica Libre' : 'Laboratorio seleccionado');
  };

  const activeLab = labs.find(l => l.id === activeLabId);

  return (
    <div className="absolute inset-0 flex flex-col bg-[var(--upt-bg)]">
      <div className="h-10 sm:h-12 bg-[var(--upt-surface)] border-b border-white/[0.06] flex items-center px-2 sm:px-4 relative z-30 shrink-0 gap-1 sm:gap-0">
        <button 
          onClick={() => setShowLabSelector(!showLabSelector)}
          className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-[var(--upt-text-primary)] hover:bg-white/5 px-2 sm:px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-white/10 min-w-0"
        >
          <BookOpen className="w-4 h-4 text-[var(--upt-gold)] shrink-0" />
          <span className="font-bold truncate max-w-[120px] sm:max-w-none">{activeLab ? activeLab.title : 'Lab Libre'}</span>
          <ChevronDown className="w-4 h-4 text-white/40 shrink-0" />
        </button>

        {activeLab && (
          <button
            onClick={() => setShowDescription(!showDescription)}
            className={`ml-2 p-1.5 rounded-lg transition-all ${showDescription ? 'bg-[var(--upt-gold)] text-[var(--upt-bg)]' : 'text-[var(--upt-gold)] hover:bg-[var(--upt-gold)]/10'}`}
            title="Ver descripción del reto"
          >
            <Info className="w-5 h-5" />
          </button>
        )}

        {showLabSelector && (
          <div className="absolute top-full left-0 sm:left-4 mt-1 w-[calc(100vw-1rem)] sm:w-80 bg-[var(--upt-surface)] border border-white/10 rounded-xl shadow-2xl py-2 z-50 max-h-[60vh] overflow-y-auto">
            <div className="px-4 py-2 border-b border-white/5 mb-2">
              <p className="text-xs font-bold text-[var(--upt-text-tertiary)] uppercase tracking-wider">Seleccionar Laboratorio</p>
            </div>
            <button 
              onClick={() => selectLab('')}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors ${!activeLabId ? 'bg-white/5 text-[var(--upt-gold)]' : 'text-white'}`}
            >
              <span className="font-bold block">Laboratorio Libre</span>
              <span className="text-xs opacity-60">Práctica sin evaluación</span>
            </button>
            {labs.map(lab => (
              <button 
                key={lab.id}
                onClick={() => selectLab(lab.id)}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors ${activeLabId === lab.id ? 'bg-white/5 text-[var(--upt-gold)]' : 'text-white'}`}
              >
                <span className="font-bold block">{lab.title}</span>
                <span className="text-xs opacity-60 block truncate">
                  {lab.difficulty === 'easy' ? 'Fácil' : lab.difficulty === 'hard' ? 'Difícil' : 'Media'}
                  &nbsp;• Creado por: {lab.teacher_name}
                </span>
              </button>
            ))}
          </div>
        )}

        {activeLab && (
          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={handleRunTests}
              disabled={isTesting}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 bg-[var(--upt-bg-deep)] hover:bg-[var(--upt-surface)] disabled:opacity-40 text-[var(--upt-gold)] border border-[var(--upt-gold)]/25 hover:border-[var(--upt-gold)]/50 rounded-md text-xs font-semibold transition-all cursor-pointer"
            >
              {isTesting
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <CheckSquare className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isTesting ? 'Evaluando...' : 'Evaluar Reto'}</span>
              <span className="sm:hidden">{isTesting ? '...' : 'Evaluar'}</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden border-r border-white/[0.06]">
          <EditorPanel
            code={code}
            setCode={setCode}
            isExecuting={isExecuting}
            onExecute={handleExecuteCode}
            onConsult={handleToggleAssistant}
            showAssistant={showAssistant}
            isAiDisabled={!!activeLabId}
            language={language}
            setLanguage={handleLanguageChange}
            editorTheme={editorTheme}
            onToggleTheme={handleToggleTheme}
            onSave={handleSave}
          />
          <ConsolePanel
            isExecuting={isExecuting}
            output={consoleOutput}
            onSendInput={sendConsoleInput}
          />
        </div>

        {showAssistant && (
          <div className="fixed inset-0 z-40 lg:relative lg:inset-auto lg:w-96 xl:w-[420px] shrink-0 flex flex-col overflow-hidden shadow-2xl bg-[var(--upt-bg)]">
            <SocraticPanel
              messages={chatMessages}
              setMessages={setChatMessages}
              onClose={() => setShowAssistant(false)}
              code={code}
              language={language}
              laboratoryId={activeLabId}
              consoleOutput={consoleOutput}
            />
          </div>
        )}

        {showTestResults && (
          <TestResultsPanel 
            results={testResults?.results}
            isTesting={isTesting}
            onClose={() => setShowTestResults(false)}
            allPassed={testResults?.all_passed}
            passedCount={testResults?.passed_count}
            totalCount={testResults?.total_count}
          />
        )}

        {showDescription && activeLab && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-10 bg-[var(--upt-bg)]/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-[var(--upt-surface)] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] sm:max-h-full overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[var(--upt-gold)]/10 rounded-xl">
                    <BookOpen className="w-6 h-6 text-[var(--upt-gold)]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[var(--upt-text-primary)]">{activeLab.title}</h2>
                    <p className="text-xs text-[var(--upt-text-tertiary)] uppercase tracking-widest font-bold">Instrucciones del Reto</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowDescription(false)}
                  className="p-2 hover:bg-white/5 rounded-full text-[var(--upt-text-tertiary)] hover:text-white transition-all"
                >
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                <div className="flex items-center gap-6">
                  <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-[10px] text-[var(--upt-text-tertiary)] uppercase font-black mb-1">Dificultad</p>
                    <p className={`text-sm font-bold capitalize ${activeLab.difficulty === 'easy' ? 'text-emerald-400' : activeLab.difficulty === 'hard' ? 'text-rose-400' : 'text-amber-400'}`}>
                      {activeLab.difficulty === 'easy' ? 'Principiante' : activeLab.difficulty === 'hard' ? 'Avanzado' : 'Intermedio'}
                    </p>
                  </div>
                  <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-[10px] text-[var(--upt-text-tertiary)] uppercase font-black mb-1">Docente</p>
                    <p className="text-sm font-bold text-white">{activeLab.teacher_name}</p>
                  </div>
                </div>

                <div className="prose prose-invert max-w-none">
                  <div className="text-[var(--upt-text-secondary)] leading-relaxed whitespace-pre-wrap text-base">
                    {activeLab.description || "No hay una descripción detallada disponible para este laboratorio."}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-white/5 bg-white/2 flex justify-end">
                <button 
                  onClick={() => setShowDescription(false)}
                  className="px-8 py-3 bg-[var(--upt-gold)] text-[var(--upt-bg)] rounded-xl font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[var(--upt-gold)]/20"
                >
                  Entendido, ¡a programar!
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
