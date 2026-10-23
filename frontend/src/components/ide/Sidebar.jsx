import {
  Home, FolderOpen, BarChart2, HelpCircle, Code2,
  Database, Users, Activity, Zap, ShieldCheck, PieChart, LayoutDashboard, LayoutGrid, FileSpreadsheet, Megaphone
} from 'lucide-react';
import imgAdmin from '../../assets/admin.png';
import imgDocente from '../../assets/docente.png';
import imgEstudiante from '../../assets/estudiante.png';

const studentNav = [
  { tab: 'overview', icon: Home, label: 'Mi Panel' },
  { tab: 'challenges', icon: LayoutGrid, label: 'Catálogo de Retos' },
  { tab: 'practice', icon: Code2, label: 'Sala de Práctica' },
  { tab: 'progress', icon: BarChart2, label: 'Mis Avances' },
];

const teacherNav = [
  { tab: 'overview', icon: LayoutDashboard, label: 'Mi Panel' },
  { tab: 'teacher/analytics', icon: PieChart, label: 'Analítica de Errores' },
  { tab: 'teacher/knowledge', icon: Database, label: 'Base de Conocimiento' },
  { tab: 'teacher/labs', icon: FolderOpen, label: 'Gestión de Laboratorios' },
  { tab: 'teacher/reports', icon: FileSpreadsheet, label: 'Exportar Reportes' },
  { tab: 'teacher/announcements', icon: Megaphone, label: 'Notificaciones' },
];

const adminNav = [
  { tab: 'overview', icon: LayoutDashboard, label: 'Mi Panel' },
  { tab: 'admin/users', icon: Users, label: 'Gestión de Usuarios' },
  { tab: 'admin/system', icon: Activity, label: 'Estado del Sistema' },
  { tab: 'admin/api', icon: Zap, label: 'Consumo de API' },
  { tab: 'admin/logs', icon: ShieldCheck, label: 'Logs de Auditoría' },
  { tab: 'admin/access', icon: ShieldCheck, label: 'Accesos Especiales' },
];

function NavItem({ item, isActive, onTabChange, forceFull }) {
  const Icon = item.icon;
  return (
    <button
      onClick={() => onTabChange(item.tab)}
      className={`relative flex items-center gap-2.5 w-full px-3 min-h-[44px] rounded-lg border text-left text-[13px] transition-colors duration-150 cursor-pointer ${
        isActive
          ? 'bg-[var(--upt-sidebar-item-active-bg)] border-[var(--upt-gold)]/20 text-[var(--upt-sidebar-text-active)] font-medium'
          : 'border-transparent text-[var(--upt-sidebar-text)] font-normal hover:bg-[var(--upt-sidebar-item-hover-bg)] hover:text-[var(--upt-sidebar-text-active)]'
      }`}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[var(--upt-gold)] rounded-r-full" />
      )}
      <Icon size={16} className={`shrink-0 ${isActive ? 'text-[var(--upt-gold)]' : 'text-[var(--upt-sidebar-text)] opacity-80'}`} />
      <span className={`${forceFull ? 'block' : 'hidden md:block'} truncate`}>{item.label}</span>
    </button>
  );
}

function SectionLabel({ text, forceFull }) {
  return (
    <div className="pt-5 pb-2 px-3">
      <p className={`${forceFull ? 'block' : 'hidden md:block'} text-[11px] uppercase tracking-[0.1em] text-[var(--upt-text-tertiary)] font-bold`}>{text}</p>
      <div className={`${forceFull ? 'hidden' : 'md:hidden'} h-px bg-[var(--upt-sidebar-border)]`} />
    </div>
  );
}

export default function Sidebar({ activeTab, onTabChange, role, forceFull }) {
  const getRoleLabel = () => {
    if (role === 'admin') return 'Administrador';
    if (role === 'teacher') return 'Docente';
    return 'Estudiante';
  };

  const getRoleImage = () => {
    if (role === 'admin') return imgAdmin;
    if (role === 'teacher') return imgDocente;
    return imgEstudiante;
  };

  const getSections = () => {
    if (role === 'admin') return [
      { label: 'Panel', items: adminNav.slice(0, 1) },
      { label: 'Soporte Técnico', items: adminNav.slice(1, 4) },
      { label: 'Seguridad', items: adminNav.slice(4) },
    ];
    if (role === 'teacher') return [
      { label: 'Panel', items: teacherNav.slice(0, 1) },
      { label: 'Gestión Académica', items: teacherNav.slice(1) },
    ];
    return [{ label: null, items: studentNav }];
  };

  return (
    <aside className={`${forceFull ? 'w-64' : 'w-16 md:w-64'} bg-[var(--upt-sidebar-bg)] border-r border-[var(--upt-sidebar-border)] flex flex-col justify-between shrink-0 h-full z-20 overflow-y-auto relative`}>
      <div className="py-6">
        <div className={`${forceFull ? 'flex' : 'hidden md:flex'} flex-col items-center px-5 mb-7`}>
          <div className="w-[50px] h-[50px] rounded-full border-2 border-[var(--upt-surface-border)] mb-3">
            <img src={getRoleImage()} alt={getRoleLabel()} className="w-full h-full rounded-full object-cover" />
          </div>
          <span className="text-[11px] font-bold tracking-wide uppercase px-3 py-1 rounded-md bg-[var(--upt-surface)] text-[var(--upt-text-secondary)] border border-[var(--upt-surface-border)] shadow-sm">
            {getRoleLabel()}
          </span>
        </div>

        <nav className="flex flex-col gap-1.5 px-2.5">
          {getSections().map((section, si) => (
            <div key={si}>
              {section.label && <SectionLabel text={section.label} forceFull={forceFull} />}
              {section.items.map(item => (
                <NavItem
                  key={item.tab}
                  item={item}
                  isActive={activeTab === item.tab}
                  onTabChange={onTabChange}
                  forceFull={forceFull}
                />
              ))}
            </div>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-[var(--upt-sidebar-border)]">
        <button className="flex items-center justify-center gap-2.5 w-full px-3 min-h-[44px] rounded-xl text-[var(--upt-sidebar-text)] text-[13px] font-semibold transition-colors duration-150 hover:text-[var(--upt-sidebar-text-active)] hover:bg-[var(--upt-sidebar-item-hover-bg)] border border-transparent hover:border-[var(--upt-sidebar-border)] cursor-pointer bg-[var(--upt-sidebar-item-active-bg)] shadow-[var(--upt-shadow-sm)]">
          <HelpCircle size={16} className="shrink-0 text-[var(--upt-sidebar-text)] opacity-80" />
          <span className={`${forceFull ? 'block' : 'hidden md:block'} text-[var(--upt-sidebar-text)] hover:text-[var(--upt-sidebar-text-active)]`}>Soporte Académico</span>
        </button>
      </div>
    </aside>
  );
}
