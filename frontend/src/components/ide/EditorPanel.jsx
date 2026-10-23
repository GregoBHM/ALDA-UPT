import Editor from '@monaco-editor/react';
import { Play, MessageSquare, Save, Code, X, Sun, Moon, Lock, Loader2 } from 'lucide-react';

export default function EditorPanel({ code, setCode, isExecuting, onExecute, onConsult, showAssistant, isAiDisabled, language, setLanguage, editorTheme, onToggleTheme, onSave, onPasteDetected }) {
  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[var(--upt-bg)] border-l border-[var(--upt-surface-border)]">
      <div className="h-14 border-b border-[var(--upt-surface-border)] flex items-center px-4 sm:px-5 gap-2 shrink-0 bg-[var(--upt-surface)]">

        <button
          onClick={onExecute}
          disabled={isExecuting}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--upt-accent)] hover:bg-[var(--upt-accent-light)] disabled:opacity-50 text-white rounded-xl min-h-[40px] text-[13px] font-bold transition-colors cursor-pointer border border-transparent shadow-[var(--upt-shadow-sm)]"
        >
          {isExecuting
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Play className="w-4 h-4 fill-white" />}
          <span>{isExecuting ? 'Procesando...' : 'Ejecutar'}</span>
        </button>

        <div className="w-px h-6 bg-[var(--upt-surface-border)] mx-1" />

        {!isAiDisabled ? (
          <button
            onClick={onConsult}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] min-h-[40px] font-bold transition-all cursor-pointer border shadow-[var(--upt-shadow-sm)] ${
              showAssistant
                ? 'bg-[var(--upt-surface-light)] border-[var(--upt-gold)]/40 text-[var(--upt-gold)]'
                : 'bg-[var(--upt-surface)] border-[var(--upt-surface-border)] text-[var(--upt-text-secondary)] hover:border-[var(--upt-gold)]/30 hover:text-[var(--upt-text-primary)]'
            }`}
          >
            {showAssistant
              ? <><X className="w-4 h-4" /><span className="hidden lg:inline">Cerrar</span></>
              : <><MessageSquare className="w-4 h-4" /><span className="hidden lg:inline">Asistente</span></>}
          </button>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 bg-[var(--upt-surface)] border border-[var(--upt-surface-border)] rounded-xl text-[12px] text-[var(--upt-text-tertiary)] font-bold">
            <Lock className="w-3.5 h-3.5 opacity-80" />
            <span className="hidden sm:inline">IA bloqueada</span>
          </div>
        )}

        <div className="flex-1" />

        <button
          onClick={onToggleTheme}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--upt-surface)] border border-[var(--upt-surface-border)] hover:bg-[var(--upt-surface-light)] text-[var(--upt-text-secondary)] hover:text-[var(--upt-text-primary)] transition-all cursor-pointer shadow-[var(--upt-shadow-sm)]"
          title={editorTheme === 'vs-dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
        >
          {editorTheme === 'vs-dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <div className="hidden sm:flex items-center gap-2 bg-[var(--upt-surface)] border border-[var(--upt-surface-border)] px-3 h-10 rounded-xl hover:bg-[var(--upt-surface-light)] cursor-pointer transition-colors shadow-[var(--upt-shadow-sm)]">
          <Code className="w-4 h-4 text-[var(--upt-text-secondary)]" />
          <select
            className="bg-transparent text-[13px] font-bold text-[var(--upt-text-secondary)] focus:outline-none appearance-none cursor-pointer"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{ colorScheme: 'inherit' }}
          >
            <option value="cpp">C++ (GCC)</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="javascript">JavaScript (Node)</option>
          </select>
        </div>

        <button
          onClick={onSave}
          className="flex items-center justify-center gap-1.5 px-3 w-10 sm:w-auto h-10 bg-[var(--upt-surface)] border border-[var(--upt-surface-border)] hover:bg-[var(--upt-surface-light)] text-[var(--upt-text-secondary)] hover:text-[var(--upt-text-primary)] rounded-xl text-[13px] font-bold transition-all cursor-pointer shadow-[var(--upt-shadow-sm)]"
        >
          <Save className="w-4 h-4" />
          <span className="hidden sm:inline">Guardar</span>
        </button>
      </div>

      <div className="flex-1 min-h-0 relative">
        <Editor
          height="100%"
          language={language}
          theme={editorTheme}
          value={code}
          onChange={(val) => setCode(val)}
          onMount={(editor) => {
            editor.onDidPaste((e) => {
              const pastedLines = e.range.endLineNumber - e.range.startLineNumber;
              if (pastedLines >= 8 && onPasteDetected) {
                onPasteDetected();
              }
            });
          }}
          options={{
            minimap: { enabled: false },
            fontSize: 15,
            fontFamily: "JetBrains Mono, Fira Code, monospace",
            lineHeight: 26,
            padding: { top: 24, bottom: 24 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            scrollbar: {
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10,
            }
          }}
        />
      </div>
    </div>
  );
}
