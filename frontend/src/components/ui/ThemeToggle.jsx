import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ theme, onToggle }) {
  return (
    <button
      onClick={onToggle}
      title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className="w-9 h-9 rounded-xl border border-[var(--upt-sidebar-border)] bg-[var(--upt-sidebar-item-hover-bg)] flex items-center justify-center cursor-pointer text-[var(--upt-sidebar-text)] hover:text-[var(--upt-sidebar-text-active)] hover:bg-[var(--upt-sidebar-item-active-bg)] transition-all duration-200 shrink-0"
    >
      {theme === 'dark'
        ? <Sun size={16} />
        : <Moon size={16} />
      }
    </button>
  );
}
