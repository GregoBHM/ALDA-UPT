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
  { tab: 'overview', icon: LayoutDashboard, label: 'Panel Docente' },
  { tab: 'teacher/analytics', icon: PieChart, label: 'Analítica de Errores' },
  { tab: 'teacher/knowledge', icon: Database, label: 'Base de Conocimiento' },
  { tab: 'teacher/labs', icon: FolderOpen, label: 'Gestión de Laboratorios' },
  { tab: 'teacher/reports', icon: FileSpreadsheet, label: 'Exportar Reportes' },
  { tab: 'teacher/announcements', icon: Megaphone, label: 'Notificaciones' },
  { tab: 'practice', icon: Code2, label: 'Sala de Práctica' },
];

const adminNav = [
  { tab: 'overview', icon: LayoutDashboard, label: 'Panel Admin' },
  { tab: 'admin/users', icon: Users, label: 'Gestión de Usuarios' },
  { tab: 'admin/system', icon: Activity, label: 'Estado del Sistema' },
  { tab: 'admin/api', icon: Zap, label: 'Consumo de API' },
  { tab: 'admin/logs', icon: ShieldCheck, label: 'Logs de Auditoría' },
  { tab: 'admin/access', icon: ShieldCheck, label: 'Accesos Especiales' },
  { tab: 'teacher/analytics', icon: PieChart, label: 'Analítica de Errores' },
  { tab: 'teacher/knowledge', icon: Database, label: 'Base de Conocimiento' },
  { tab: 'teacher/labs', icon: FolderOpen, label: 'Gestión de Labs' },
  { tab: 'teacher/reports', icon: FileSpreadsheet, label: 'Exportar Reportes' },
  { tab: 'teacher/announcements', icon: Megaphone, label: 'Notificaciones' },
  { tab: 'practice', icon: Code2, label: 'Sala de Práctica' },
];

function NavItem({ item, isActive, onTabChange, forceFull }) {
  const Icon = item.icon;
  return (
    <button
      onClick={() => onTabChange(item.tab)}
      className={`relative flex items-center gap-2.5 w-full px-3 py-2 rounded-lg border text-left text-[13px] transition-colors duration-150 cursor-pointer ${
        isActive
          ? 'bg-[var(--upt-surface-light)] border-[var(--upt-gold)]/15 text-[var(--upt-text-primary)] font-medium'
          : 'border-transparent text-[var(--upt-sidebar-text)] font-normal hover:bg-white/[0.04] hover:text-[var(--upt-text-secondary)]'
      }`}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-[var(--upt-gold)]/70 rounded-r-full" />
      )}
      <Icon size={15} className={`shrink-0 ${isActive ? 'text-[var(--upt-gold)]/80' : 'opacity-40'}`} />
      <span className={`${forceFull ? 'block' : 'hidden md:block'} truncate`}>{item.label}</span>
    </button>
  );
}

function SectionLabel({ text, forceFull }) {
  return (
    <div className="pt-4 pb-1.5 px-3">
      <p className={`${forceFull ? 'block' : 'hidden md:block'} text-[10px] uppercase tracking-[0.12em] text-white/20 font-semibold`}>{text}</p>
      <div className={`${forceFull ? 'hidden' : 'md:hidden'} h-px bg-white/[0.06]`} />
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
      { label: 'Soporte Técnico', items: adminNav.slice(0, 6) },
      { label: 'Gestión Académica', items: adminNav.slice(6, 11) },
      { label: 'Herramientas', items: adminNav.slice(11) },
    ];
    if (role === 'teacher') return [
      { label: 'Panel', items: teacherNav.slice(0, 1) },
      { label: 'Gestión Académica', items: teacherNav.slice(1, 6) },
      { label: 'Herramientas', items: teacherNav.slice(6) },
    ];
    return [{ label: null, items: studentNav }];
  };

  return (
    <aside className={`${forceFull ? 'w-64' : 'w-16 md:w-64'} bg-[var(--upt-sidebar-bg)] border-r border-[var(--upt-sidebar-border)] flex flex-col justify-between shrink-0 h-full z-20 overflow-y-auto relative`}>
      <div className="py-6">
        <div className={`${forceFull ? 'flex' : 'hidden md:flex'} flex-col items-center px-5 mb-7`}>
          <div className="w-[44px] h-[44px] rounded-full border border-white/10 mb-2">
            <img src={getRoleImage()} alt={getRoleLabel()} className="w-full h-full rounded-full object-cover" />
          </div>
          <span className="text-[10px] font-medium tracking-wide uppercase px-2.5 py-0.5 rounded-md bg-white/[0.05] text-zinc-500 border border-white/[0.07]">
            {getRoleLabel()}
          </span>
        </div>

        <nav className="flex flex-col gap-1 px-2.5">
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

      <div className="p-3 border-t border-[var(--upt-sidebar-border)]">
        <button className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-zinc-600 text-[13px] font-normal transition-colors duration-150 hover:text-zinc-400 hover:bg-white/[0.03] cursor-pointer border-none bg-transparent">
          <HelpCircle size={15} className="shrink-0" />
          <span className={`${forceFull ? 'block' : 'hidden md:block'}`}>Soporte</span>
        </button>
      </div>
    </aside>
  );
}
