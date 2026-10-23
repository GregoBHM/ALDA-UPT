import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/ide/Sidebar';
import { LogOut, Bell, Megaphone, X, Menu, AlertTriangle } from 'lucide-react';
import ThemeToggle from '../components/ui/ThemeToggle';
import { useTheme } from '../hooks/useTheme';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import { authLogout, syncMe, getAnnouncements } from '../api';
import SmartOverview from './SmartOverview';
import PracticeRoom from './student/PracticeRoom';
import ChallengesCatalog from './student/ChallengesCatalog';
import Progress from './student/Progress';
import ErrorAnalytics from './teacher/ErrorAnalytics';
import KnowledgeManager from './teacher/KnowledgeManager';
import LabManager from './teacher/LabManager';
import ReportsExport from './teacher/ReportsExport';
import Announcements from './teacher/Announcements';
import UserManagement from './admin/UserManagement';
import SystemStatus from './admin/SystemStatus';
import ApiConsumption from './admin/ApiConsumption';
import AuditLogs from './admin/AuditLogs';
import AllowedEmails from './admin/AllowedEmails';


const VIEWS = {
  overview: SmartOverview,
  practice: PracticeRoom,
  challenges: ChallengesCatalog,
  progress: Progress,
  'teacher/analytics': ErrorAnalytics,
  'teacher/knowledge': KnowledgeManager,
  'teacher/labs': LabManager,
  'teacher/reports': ReportsExport,
  'teacher/announcements': Announcements,
  'admin/users': UserManagement,
  'admin/system': SystemStatus,
  'admin/api': ApiConsumption,
  'admin/logs': AuditLogs,
  'admin/access': AllowedEmails,
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState(
    () => sessionStorage.getItem('alda_active_tab') || 'overview'
  );
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const sessionTimerRef = useRef(null);
  const sessionWarnRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [readIds, setReadIds] = useState(() => {
    try { return new Set(JSON.parse(sessionStorage.getItem('alda_read_notifs') || '[]')); }
    catch { return new Set(); }
  });
  const notifRef = useRef(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('user');
    if (!raw) {
      navigate('/auth');
      return;
    }
    const currentUser = JSON.parse(raw);
    setUser(currentUser);

    const syncUser = async () => {
      try {
        const freshData = await syncMe(currentUser.id);
        if (freshData.role !== currentUser.role || !freshData.is_active) {
          if (!freshData.is_active) { handleLogout(); return; }
          sessionStorage.setItem('user', JSON.stringify(freshData));
          setUser(freshData);
        }
      } catch {}
    };

    const fetchNotifications = async () => {
      try {
        const data = await getAnnouncements(currentUser.id);
        setNotifications(Array.isArray(data) ? data : []);
      } catch {}
    };

    syncUser();
    fetchNotifications();
    const intervalId = setInterval(syncUser, 15000);
    const notifInterval = setInterval(fetchNotifications, 30000);

    return () => {
      clearInterval(intervalId);
      clearInterval(notifInterval);
    };
  }, [navigate]);

  useEffect(() => {
    const handler = (e) => handleTabChange(e.detail);
    window.addEventListener('alda:navigate', handler);
    return () => window.removeEventListener('alda:navigate', handler);
  }, []);

  useEffect(() => {
    const WARNING_MS = 1800000 - 120000; // aviso 2 min antes
    const LOGOUT_MS  = 1800000;

    const resetTimers = () => {
      setShowSessionWarning(false);
      clearTimeout(sessionWarnRef.current);
      clearTimeout(sessionTimerRef.current);
      sessionWarnRef.current  = setTimeout(() => setShowSessionWarning(true), WARNING_MS);
      sessionTimerRef.current = setTimeout(() => handleLogout(), LOGOUT_MS);
    };

    const events = ['mousemove', 'keydown', 'click'];
    events.forEach(ev => window.addEventListener(ev, resetTimers));
    resetTimers();
    return () => {
      events.forEach(ev => window.removeEventListener(ev, resetTimers));
      clearTimeout(sessionWarnRef.current);
      clearTimeout(sessionTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifPanel(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    sessionStorage.setItem('alda_active_tab', tab);
    setShowMobileSidebar(false);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const u = JSON.parse(sessionStorage.getItem('user') || '{}');
      const uid = u.id || '';
      const keysToRemove = [
        'alda_chat_messages', 'alda_saved_code', 'alda_saved_language',
        'alda_editor_theme', 'alda_active_lab', 'alda_chat_ratings',
        ...(uid ? [
          `alda_chat_${uid}`, `alda_code_${uid}`, `alda_lang_${uid}`,
          `alda_theme_${uid}`, `alda_lab_${uid}`
        ] : [])
      ];
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch {}
    try { await authLogout(); } catch {}
    sessionStorage.clear();
    setTimeout(() => navigate('/'), 800);
  };

  const markAllRead = () => {
    const allIds = new Set(notifications.map(n => n.id || n.title));
    setReadIds(allIds);
    sessionStorage.setItem('alda_read_notifs', JSON.stringify([...allIds]));
  };

  const toggleNotifPanel = () => {
    setShowNotifPanel(prev => !prev);
    if (!showNotifPanel) markAllRead();
  };

  const unreadCount = notifications.filter(n => !readIds.has(n.id || n.title)).length;

  if (!user) return null;

  const ActiveView = VIEWS[activeTab] || SmartOverview;

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-[var(--upt-bg)]">
      {isLoggingOut && (
        <div className="fixed inset-0 z-[200] bg-[var(--upt-bg)]/95 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
          <div className="w-8 h-8 border-2 border-[var(--upt-surface-border)] border-t-[var(--upt-accent-light)] rounded-full animate-spin" />
          <p className="text-sm text-[var(--upt-text-secondary)] font-medium">Cerrando sesión...</p>
        </div>
      )}

      <header className="h-14 bg-[var(--upt-sidebar-bg)] border-b border-[var(--upt-sidebar-border)] flex items-center justify-between px-3 sm:px-6 shrink-0 z-30">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowMobileSidebar(!showMobileSidebar)}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl border-none bg-transparent text-[var(--upt-sidebar-text)] cursor-pointer transition-all hover:text-[var(--upt-sidebar-text-active)] hover:bg-[var(--upt-sidebar-item-hover-bg)]"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[var(--upt-gold)]/10 border border-[var(--upt-gold)]/25">
            <span className="text-[var(--upt-gold)] font-bold text-[12px] tracking-[0.05em]">ALDA</span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-[var(--upt-sidebar-border)]" />
          <span className="hidden lg:block text-[var(--upt-sidebar-text)] text-[13px] font-medium">
            Plataforma Educativa · EPIS-UPT
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle theme={theme} onToggle={toggleTheme} />

          <div className="relative" ref={notifRef}>
            <button
              onClick={toggleNotifPanel}
              className="relative flex items-center justify-center w-9 h-9 rounded-xl border border-[var(--upt-sidebar-border)] bg-[var(--upt-sidebar-item-hover-bg)] text-[var(--upt-sidebar-text)] cursor-pointer transition-all duration-200 hover:text-[var(--upt-sidebar-text-active)] hover:bg-[var(--upt-sidebar-item-active-bg)]"
              title="Notificaciones"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold text-white bg-[var(--upt-error)] rounded-full border-2 border-[var(--upt-sidebar-bg)]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifPanel && (
              <div
                className="absolute right-0 top-12 w-[calc(100vw-2rem)] sm:w-80 bg-[var(--upt-surface)] border border-[var(--upt-surface-border)] rounded-2xl shadow-[var(--upt-shadow-lg)] z-50 overflow-hidden"
                style={{ animation: 'scale-in 0.15s ease-out' }}
              >
                <div className="px-4 py-3.5 border-b border-[var(--upt-surface-border)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell size={14} className="text-[var(--upt-gold)]" />
                    <span className="text-[13px] font-bold text-[var(--upt-text-primary)]">Notificaciones</span>
                  </div>
                  <button
                    onClick={() => setShowNotifPanel(false)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-transparent border-none text-[var(--upt-text-tertiary)] hover:text-[var(--upt-text-primary)] hover:bg-[var(--upt-surface-light)] cursor-pointer transition-all"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-12 text-center">
                      <Bell size={28} className="text-[var(--upt-text-tertiary)] mx-auto mb-3 opacity-50" />
                      <p className="text-[13px] text-[var(--upt-text-secondary)]">Sin notificaciones</p>
                    </div>
                  ) : (
                    notifications.map((notif, i) => (
                      <div key={notif.id || i} className="relative px-4 py-3.5 border-b border-[var(--upt-surface-border)] hover:bg-[var(--upt-surface-light)] transition-colors">
                        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[var(--upt-gold)] rounded-r-full opacity-60" />
                        <div className="flex items-start gap-3 pl-1">
                          <div className="w-8 h-8 rounded-xl shrink-0 bg-[var(--upt-gold)]/10 border border-[var(--upt-gold)]/20 flex items-center justify-center mt-0.5">
                            <Megaphone size={13} className="text-[var(--upt-gold)]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-bold text-[var(--upt-text-primary)] mb-0.5 truncate">{notif.title}</p>
                            <p className="text-[11px] text-[var(--upt-text-secondary)] leading-relaxed line-clamp-2">{notif.content}</p>
                            <span className="text-[11px] text-[var(--upt-text-tertiary)] mt-1 block">
                              {notif.created_at ? new Date(notif.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }) : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="px-4 py-2.5 border-t border-[var(--upt-surface-border)] bg-[var(--upt-surface-light)]">
                    <p className="text-[11px] text-[var(--upt-text-tertiary)] text-center">
                      {notifications.length} anuncio{notifications.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="hidden sm:block w-px h-5 bg-[var(--upt-sidebar-border)]" />

          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[var(--upt-sidebar-item-hover-bg)] border border-[var(--upt-sidebar-border)]">
            {user.avatar && (
              <img src={user.avatar} alt="" className="w-[22px] h-[22px] rounded-full object-cover ring-1 ring-[var(--upt-sidebar-border)]" />
            )}
            <span className="text-[var(--upt-sidebar-text-active)] text-[13px] font-semibold hidden md:inline">{user.name}</span>
          </div>

          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="flex items-center justify-center w-9 h-9 rounded-xl border border-[var(--upt-sidebar-border)] bg-transparent text-[var(--upt-sidebar-text)] cursor-pointer transition-all duration-200 hover:text-[var(--upt-error)] hover:bg-[var(--upt-error)]/10 hover:border-[var(--upt-error)]/20"
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden min-h-0">
        {showMobileSidebar && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMobileSidebar(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-64 z-50" style={{ animation: 'slide-in-left 0.2s ease-out' }}>
              <Sidebar activeTab={activeTab} onTabChange={handleTabChange} role={user.role} forceFull />
            </div>
          </div>
        )}
        <div className="hidden md:block">
          <Sidebar activeTab={activeTab} onTabChange={handleTabChange} role={user.role} />
        </div>
        <main className="flex-1 relative overflow-auto min-h-0" style={{ animation: 'fade-in 0.3s ease' }}>
          <ErrorBoundary>
            <ActiveView theme={theme} />
          </ErrorBoundary>
        </main>
      </div>

      {/* Modal de advertencia de sesión */}
      {showSessionWarning && (
        <div className="fixed inset-0 z-[300] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-[var(--upt-surface)] border border-[var(--upt-warning)]/30 rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[var(--upt-warning)]/10 border border-[var(--upt-warning)]/20 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-[var(--upt-warning)]" />
            </div>
            <h3 className="text-base font-bold text-[var(--upt-text-primary)] mb-1">Sesión por vencer</h3>
            <p className="text-sm text-[var(--upt-text-secondary)] mb-5">
              Tu sesión cerrará automáticamente en 2 minutos por inactividad. ¿Deseas continuar?
            </p>
            <button
              onClick={() => { setShowSessionWarning(false); }}
              className="w-full py-2.5 bg-[var(--upt-accent)] text-white rounded-xl font-bold text-sm hover:bg-[var(--upt-accent-dark)] transition-colors cursor-pointer"
            >
              Sí, continuar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
