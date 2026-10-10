import { useEffect, useRef, useCallback } from 'react';
import { Terminal as TerminalIcon, Trash2, Square } from 'lucide-react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';

export default function ConsolePanel({ isExecuting, output, onSendInput, onClear, onStop }) {
  const containerRef = useRef(null);
  const termRef = useRef(null);
  const fitAddonRef = useRef(null);
  const inputBufferRef = useRef('');
  const prevOutputLenRef = useRef(0);
  const isExecutingRef = useRef(isExecuting);
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);

  useEffect(() => { isExecutingRef.current = isExecuting; }, [isExecuting]);

  useEffect(() => {
    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontFamily: '"Fira Code", "JetBrains Mono", "Cascadia Code", "Consolas", monospace',
      fontWeight: '400',
      fontWeightBold: '600',
      fontSize: 13,
      lineHeight: 1.5,
      letterSpacing: 0.3,
      theme: {
        background:    '#0a0e1a',
        foreground:    '#e2e8f0',
        cursor:        '#eab308',
        cursorAccent:  '#0a0e1a',
        selectionBackground: 'rgba(234,179,8,0.18)',
        selectionForeground: '#ffffff',
        black:         '#0a0e1a',
        red:           '#f43f5e',
        green:         '#10b981',
        yellow:        '#eab308',
        blue:          '#3b82f6',
        magenta:       '#a855f7',
        cyan:          '#06b6d4',
        white:         '#e2e8f0',
        brightBlack:   '#475569',
        brightRed:     '#fb7185',
        brightGreen:   '#34d399',
        brightYellow:  '#facc15',
        brightBlue:    '#60a5fa',
        brightMagenta: '#c084fc',
        brightCyan:    '#22d3ee',
        brightWhite:   '#f8fafc',
      },
      allowTransparency: true,
      scrollback: 5000,
      convertEol: true,
      rightClickSelectsWord: true,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);

    term.open(containerRef.current);

    requestAnimationFrame(() => {
      try { fitAddon.fit(); } catch {}
    });

    termRef.current = term;
    fitAddonRef.current = fitAddon;

    // Prompt inicial estilo bash
    term.writeln('\x1b[38;2;148;163;184mTerminal lista.\x1b[0m');
    term.write('$ ');

    term.onKey(({ key, domEvent }) => {
      if (!isExecutingRef.current) return;

      const printable = !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey;

      // Ctrl+C para interrumpir
      if (domEvent.ctrlKey && domEvent.key === 'c') {
        term.write('^C\r\n');
        inputBufferRef.current = '';
        return;
      }

      if (domEvent.keyCode === 13) { // Enter
        const line = inputBufferRef.current;
        term.write('\r\n');
        // Guardar en historial
        if (line.trim()) {
          historyRef.current.push(line);
          if (historyRef.current.length > 50) historyRef.current.shift();
        }
        historyIndexRef.current = -1;
        inputBufferRef.current = '';
        if (onSendInput) onSendInput(line);
        if (!isExecutingRef.current) {
          term.write('$ ');
        }
      } else if (domEvent.keyCode === 8) { // Backspace
        if (inputBufferRef.current.length > 0) {
          inputBufferRef.current = inputBufferRef.current.slice(0, -1);
          term.write('\b \b');
        }
      } else if (domEvent.keyCode === 38) { // Flecha arriba — historial
        const hist = historyRef.current;
        if (hist.length === 0) return;
        if (historyIndexRef.current === -1) historyIndexRef.current = hist.length;
        if (historyIndexRef.current > 0) {
          historyIndexRef.current--;
          // Borrar línea actual
          const clearLen = inputBufferRef.current.length;
          term.write('\b \b'.repeat(clearLen));
          const entry = hist[historyIndexRef.current];
          inputBufferRef.current = entry;
          term.write(entry);
        }
      } else if (domEvent.keyCode === 40) { // Flecha abajo — historial
        const hist = historyRef.current;
        if (historyIndexRef.current === -1) return;
        const clearLen = inputBufferRef.current.length;
        term.write('\b \b'.repeat(clearLen));
        if (historyIndexRef.current < hist.length - 1) {
          historyIndexRef.current++;
          const entry = hist[historyIndexRef.current];
          inputBufferRef.current = entry;
          term.write(entry);
        } else {
          historyIndexRef.current = -1;
          inputBufferRef.current = '';
        }
      } else if (printable) {
        inputBufferRef.current += key;
        term.write(key);
      }
    });

    // Pegar con Ctrl+V
    term.attachCustomKeyEventHandler((e) => {
      if (e.ctrlKey && e.key === 'v' && e.type === 'keydown') {
        navigator.clipboard.readText().then(text => {
          if (text && isExecutingRef.current) {
            // Solo primera línea
            const firstLine = text.split('\n')[0].replace('\r', '');
            inputBufferRef.current += firstLine;
            termRef.current?.write(firstLine);
          }
        }).catch(() => {});
        return false;
      }
      return true;
    });

    const ro = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        try { fitAddon.fit(); } catch {}
      });
    });
    if (containerRef.current) ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      term.dispose();
    };
  }, []);

  useEffect(() => {
    const term = termRef.current;
    if (!term) return;
    if (isExecuting) {
      term.write('\x1b[38;2;148;163;184m$ ./ejecutar\x1b[0m\r\n');
    } else if (prevOutputLenRef.current > 0) {
      term.write('\r\n\x1b[38;2;148;163;184m[Proceso finalizado]\x1b[0m\r\n$ ');
    }
  }, [isExecuting]);

  useEffect(() => {
    const term = termRef.current;
    if (!term) return;

    const newLines = output.slice(prevOutputLenRef.current);
    prevOutputLenRef.current = output.length;

    for (const line of newLines) {
      const text = line.text ?? '';
      switch (line.type) {
        case 'stdout':
          term.write(text);
          break;
        case 'error':
          term.write(`\x1b[38;2;244;63;94m${text}\x1b[0m`);
          break;
        case 'system':
          term.write(`\x1b[38;2;148;163;184m${text}\x1b[0m`);
          break;
        case 'stdin':
          break;
        case 'warning':
          term.write(`\x1b[38;2;234;179;8m${text}\x1b[0m`);
          break;
        default:
          term.write(text);
      }
    }
  }, [output]);

  const handleClear = useCallback(() => {
    const term = termRef.current;
    if (!term) return;
    term.clear();
    term.write('\x1b[38;2;148;163;184mTerminal limpia.\x1b[0m\r\n$ ');
    prevOutputLenRef.current = 0;
    if (onClear) onClear();
  }, [onClear]);

  return (
    <div className="flex flex-col shrink-0 border-t border-[var(--upt-surface-border)]" style={{ height: '240px' }}>
      <div
        className="flex items-center justify-between px-3 shrink-0"
        style={{ background: '#0a0e1a', borderBottom: '1px solid rgba(255,255,255,0.1)', height: '34px' }}
      >
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-slate-400" />
          <span className="text-[12px] font-medium text-slate-300">Terminal</span>
          {isExecuting && (
            <span className="text-[11px] text-emerald-400 ml-2 animate-pulse">Running...</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {isExecuting && onStop && (
            <button
              onClick={onStop}
              title="Detener ejecución (Ctrl+C)"
              className="flex items-center gap-1 px-2 py-1 rounded transition-colors"
              style={{ color: '#f43f5e', fontSize: '10px', fontWeight: 700 }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <Square className="w-3 h-3" fill="#f43f5e" />
              <span>Stop</span>
            </button>
          )}
          <button
            onClick={handleClear}
            title="Limpiar terminal"
            className="flex items-center justify-center rounded transition-colors"
            style={{ width: '24px', height: '24px', color: 'rgba(255,255,255,0.25)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-hidden"
        style={{ background: '#0a0e1a', padding: '6px 8px' }}
      />
    </div>
  );
}
