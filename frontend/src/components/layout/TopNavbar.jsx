import logoPng from '../../assets/logo.png';

export default function TopNavbar({ rightElements = null }) {
  return (
    <nav className="fixed top-0 left-0 right-0 h-14 bg-[var(--upt-navy)]/95 backdrop-blur-xl flex items-center justify-between px-6 z-50 border-b border-white/[0.06] shadow-[0_1px_0_rgba(255,255,255,0.03)]">
      <div className="flex items-center gap-3">
        <img src={logoPng} alt="ALDA Logo" className="h-8 object-contain drop-shadow-lg" />
        <div className="hidden sm:flex items-center gap-2 ml-1">
          <div className="w-px h-4 bg-white/10" />
          <span className="text-[11px] text-white/35 font-medium tracking-wide">EPIS · UPT</span>
        </div>
      </div>
      <div className="flex items-center">
        {rightElements}
      </div>
    </nav>
  );
}
