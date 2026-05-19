import Editor from '@monaco-editor/react';
import { Play, MessageSquare, Save, Code, X, Sun, Moon, Lock, Loader2 } from 'lucide-react';

export default function EditorPanel({ code, setCode, isExecuting, onExecute, onConsult, showAssistant, isAiDisabled, language, setLanguage, editorTheme, onToggleTheme, onSave }) {
  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e2e]">
      {/* ─── Toolbar ──────────────────────────────────────────── */}
      <div className="h-12 border-b border-white/[0.06] flex items-center px-4 sm:px-5 gap-2 shrink-0 bg-[var(--upt-surface)]">

        {/* Run button — primary action, accent blue solid */}
        <button
          onClick={onExecute}
          disabled={isExecuting}
          className="flex items-center gap-2 px-4 py-1.5 bg-[var(--upt-accent)] hover:bg-[var(--upt-accent-light)] disabled:opacity-40 text-white rounded-md text-[13px] font-semibold transition-colors cursor-pointer border border-transparent"
        >
          {isExecuting
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Play className="w-3.5 h-3.5 fill-white" />}
          <span>{isExecuting ? 'Procesando...' : 'Ejecutar'}</span>
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-white/[0.08] mx-1" />

        {/* AI consult button — ghost style, gold active indicator */}
        {!isAiDisabled ? (
          <button
            onClick={onConsult}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-[13px] font-semibold transition-all cursor-pointer border ${
              showAssistant
                ? 'bg-[var(--upt-surface-light)] border-[var(--upt-gold)]/30 text-[var(--upt-gold)]'
                : 'bg-transparent border-white/[0.08] text-[var(--upt-text-secondary)] hover:border-[var(--upt-gold)]/20 hover:text-[var(--upt-text-primary)]'
            }`}
          >
            {showAssistant
              ? <><X className="w-3.5 h-3.5" /><span className="hidden lg:inline">Cerrar</span></>
              : <><MessageSquare className="w-3.5 h-3.5" /><span className="hidden lg:inline">Asistente</span></>}
          </button>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-transparent border border-white/[0.05] rounded-md text-[11px] text-white/20 font-medium">
            <Lock className="w-3 h-3" />
            <span className="hidden sm:inline">IA bloqueada</span>
          </div>
        )}

        <div className="flex-1" />

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          className="w-8 h-8 flex items-center justify-center rounded-md bg-transparent border border-white/[0.08] hover:border-[var(--upt-gold)]/20 text-[var(--upt-text-tertiary)] hover:text-[var(--upt-gold)] transition-all cursor-pointer"
          title={editorTheme === 'vs-dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
        >
          {editorTheme === 'vs-dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        {/* Language selector */}
        <div className="hidden sm:flex items-center gap-1.5 bg-transparent border border-white/[0.08] px-3 py-1.5 rounded-md hover:border-white/15 cursor-pointer transition-colors">
          <Code className="w-3.5 h-3.5 text-[var(--upt-text-tertiary)]" />
          <select
            className="bg-transparent text-[13px] font-semibold text-[var(--upt-text-secondary)] focus:outline-none appearance-none cursor-pointer"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{ colorScheme: 'dark' }}
          >
            <option value="cpp" className="bg-[#0a1a3f]">C++ (GCC)</option>
            <option value="python" className="bg-[#0a1a3f]">Python</option>
            <option value="java" className="bg-[#0a1a3f]">Java</option>
            <option value="javascript" className="bg-[#0a1a3f]">JavaScript (Node)</option>
          </select>
        </div>

        {/* Save */}
        <button
          onClick={onSave}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-transparent border border-white/[0.08] hover:border-[var(--upt-gold)]/20 text-[var(--upt-text-tertiary)] hover:text-[var(--upt-gold)] rounded-md text-[13px] font-semibold transition-all cursor-pointer"
        >
          <Save className="w-3.5 h-3.5" />
          <span className="hidden 2xl:inline">Guardar</span>
        </button>
      </div>

      {/* ─── Monaco Editor ────────────────────────────────────── */}
      <div className="flex-1 min-h-0 relative">
        <Editor
          height="100%"
          language={language}
          theme={editorTheme}
          value={code}
          onChange={(val) => setCode(val)}
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
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            }
          }}
        />
      </div>
    </div>
  );
}
