import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * ErrorBoundary — captura errores de render en componentes hijos.
 * Evita que un crash borre toda la app mostrando un mensaje amigable.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full p-8 text-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[var(--upt-error)]/10 border border-[var(--upt-error)]/20 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-[var(--upt-error)]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--upt-text-primary)] mb-1">
              Algo salió mal
            </h3>
            <p className="text-sm text-[var(--upt-text-secondary)] max-w-xs">
              Este módulo encontró un error inesperado. Intenta refrescar la página.
            </p>
            {this.state.error && (
              <p className="text-[11px] text-[var(--upt-text-tertiary)] mt-2 font-mono bg-[var(--upt-surface)] rounded px-2 py-1 max-w-sm truncate">
                {this.state.error.message}
              </p>
            )}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--upt-surface)] border border-[var(--upt-surface-border)] rounded-xl text-sm font-semibold text-[var(--upt-text-secondary)] hover:border-[var(--upt-accent)]/30 hover:text-[var(--upt-accent)] transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Recargar página
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
