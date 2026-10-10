import { useMemo } from 'react';

/**
 * Renderizador de Markdown ligero para el chat del tutor.
 * Soporta: code blocks (```), inline code (`), bold (**), italic (*), y line breaks.
 */
export default function MarkdownText({ text }) {
  const rendered = useMemo(() => parseMarkdown(text || ''), [text]);
  return <div className="markdown-chat">{rendered}</div>;
}

function parseMarkdown(text) {
  // Separar code blocks primero (```lang\ncode\n```)
  const parts = text.split(/(```[\s\S]*?```)/g);

  return parts.map((part, i) => {
    // Code block
    if (part.startsWith('```') && part.endsWith('```')) {
      const inner = part.slice(3, -3);
      const newlineIdx = inner.indexOf('\n');
      let lang = '';
      let code = inner;

      if (newlineIdx !== -1) {
        const firstLine = inner.slice(0, newlineIdx).trim();
        // Si la primera línea es un nombre de lenguaje (sin espacios, corto)
        if (firstLine.length < 20 && !firstLine.includes(' ')) {
          lang = firstLine;
          code = inner.slice(newlineIdx + 1);
        }
      }

      // Remover trailing newline
      code = code.replace(/\n$/, '');

      return (
        <div key={i} className="my-2 rounded-lg overflow-hidden border border-[var(--upt-surface-border)]">
          {lang && (
            <div className="px-3 py-1 bg-[var(--upt-surface-light)] border-b border-[var(--upt-surface-border)]">
              <span className="text-[10px] font-bold text-[var(--upt-text-tertiary)] uppercase tracking-wider">{lang}</span>
            </div>
          )}
          <pre className="bg-[var(--upt-bg)] p-3 overflow-x-auto">
            <code className="text-[12px] font-mono leading-relaxed text-[var(--upt-text-primary)]">
              {code}
            </code>
          </pre>
        </div>
      );
    }

    // Texto normal — procesar inline markdown
    return <span key={i}>{parseInline(part)}</span>;
  });
}

function parseInline(text) {
  // Split por inline code, bold, e italic
  const tokens = [];
  // Regex para: inline code (`...`), bold (**...**), italic (*...*)
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Texto antes del match
    if (match.index > lastIndex) {
      tokens.push(...splitNewlines(text.slice(lastIndex, match.index), tokens.length));
    }

    const token = match[0];
    const key = `t-${match.index}`;

    if (token.startsWith('`') && token.endsWith('`')) {
      // Inline code
      tokens.push(
        <code
          key={key}
          className="px-1.5 py-0.5 rounded bg-[var(--upt-surface)] border border-[var(--upt-surface-border)] text-[12px] font-mono text-[var(--upt-gold)]"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      // Bold
      tokens.push(
        <strong key={key} className="font-bold text-[var(--upt-text-primary)]">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      // Italic
      tokens.push(
        <em key={key} className="italic">
          {token.slice(1, -1)}
        </em>
      );
    }

    lastIndex = match.index + token.length;
  }

  // Texto restante
  if (lastIndex < text.length) {
    tokens.push(...splitNewlines(text.slice(lastIndex), tokens.length));
  }

  return tokens;
}

function splitNewlines(text, startKey) {
  const parts = text.split('\n');
  const result = [];
  parts.forEach((part, i) => {
    if (i > 0) result.push(<br key={`br-${startKey}-${i}`} />);
    if (part) result.push(part);
  });
  return result;
}
