import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/ide/Sidebar';
import { LogOut, Bell, Megaphone, X, Menu } from 'lucide-react';
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

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState(
    () => sessionStorage.getItem('alda_active_tab') || 'overview'
  );
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { 'X-User-ID': currentUser.id }
        });
        if (res.ok) {
          const freshData = await res.json();
          if (freshData.role !== currentUser.role || !freshData.is_active) {
            if (!freshData.is_active) {
              handleLogout();
              return;
            }
            sessionStorage.setItem('user', JSON.stringify(freshData));
            setUser(freshData);
          }
        }
      } catch (err) {
      }
    };

    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/student/announcements`, {
          headers: { 'X-User-ID': currentUser.id }
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications(Array.isArray(data) ? data : []);
        }
      } catch {
      }
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
    let timer;
    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        handleLogout();
      }, 1800000);
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);

    resetTimer();

    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
      clearTimeout(timer);
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

  const handleLogout = () => {
    setIsLoggingOut(true);
    // Clear all user-specific localStorage data for privacy
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
    if (!showNotifPanel) {
      markAllRead();
    }
  };

  const unreadCount = notifications.filter(n => !readIds.has(n.id || n.title)).length;

  if (!user) return null;

  const ActiveView = VIEWS[activeTab] || SmartOverview;

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-[var(--upt-bg)] font-[var(--font-sans)]">
      {/* Logout overlay */}
      {isLoggingOut && (
        <div className="fixed inset-0 z-[200] bg-[var(--upt-bg)]/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
          <div className="w-8 h-8 border-2 border-white/10 border-t-white/60 rounded-full animate-spin" />
          <p className="text-sm text-zinc-400 font-medium">Cerrando sesión...</p>
        </div>
      )}
      <header className="h-14 bg-[var(--upt-sidebar-bg)] border-b border-[var(--upt-sidebar-border)] flex items-center justify-between px-3 sm:px-6 shrink-0 z-30 shadow-[0_1px_0_rgba(255,255,255,0.03)]">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowMobileSidebar(!showMobileSidebar)}
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg border-none bg-transparent text-white/50 cursor-pointer transition-all hover:text-white/80 hover:bg-white/[0.05]"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[var(--upt-gold)]/10 border border-[var(--upt-gold)]/20">
            <span className="text-[var(--upt-gold)] font-bold text-[12px] tracking-[0.05em]">ALDA</span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-white/[0.08]" />
          <span className="hidden lg:block text-white/30 text-[13px] font-medium">
            Plataforma Educativa · EPIS-UPT
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="relative" ref={notifRef}>
            <button
              onClick={toggleNotifPanel}
              className="relative flex items-center justify-center w-9 h-9 rounded-lg border-none bg-transparent text-white/35 cursor-pointer transition-all duration-200 hover:text-white/80 hover:bg-white/[0.05]"
              title="Notificaciones"
            >
              <Bell size={17} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] flex items-center justify-center px-1 text-[9px] font-bold text-white bg-rose-500 rounded-full border-2 border-[var(--upt-sidebar-bg)]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifPanel && (
              <div className="absolute right-0 top-12 w-[calc(100vw-2rem)] sm:w-80 bg-[var(--upt-surface)] border border-white/[0.08] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] z-50 overflow-hidden" style={{ animation: 'scale-in 0.15s ease-out' }}>
                <div className="px-4 py-3.5 border-b border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell size={14} className="text-[var(--upt-gold)]" />
                    <span className="text-[13px] font-bold text-[var(--upt-text-primary)]">Notificaciones</span>
                  </div>
                  <button
                    onClick={() => setShowNotifPanel(false)}
                    className="p-1 rounded-md bg-transparent border-none text-white/30 hover:text-white/70 hover:bg-white/[0.05] cursor-pointer transition-all"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-12 text-center">
                      <Bell size={24} className="text-white/[0.06] mx-auto mb-3" />
                      <p className="text-[13px] text-[var(--upt-text-tertiary)]">Sin notificaciones</p>
                    </div>
                  ) : (
                    notifications.map((notif, i) => (
                      <div key={notif.id || i} className="relative px-4 py-3.5 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[var(--upt-gold)]/40 rounded-r-full" />
                        <div className="flex items-start gap-3 pl-1">
                          <div className="w-7 h-7 rounded-lg shrink-0 bg-[var(--upt-gold)]/[0.08] border border-[var(--upt-gold)]/15 flex items-center justify-center mt-0.5">
                            <Megaphone size={12} className="text-[var(--upt-gold)]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-bold text-[var(--upt-text-primary)] mb-0.5 truncate">{notif.title}</p>
                            <p className="text-[11px] text-[var(--upt-text-tertiary)] leading-relaxed line-clamp-2">{notif.content}</p>
                            <span className="text-[10px] text-white/20 mt-1 block">
                              {notif.created_at ? new Date(notif.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }) : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="px-4 py-2.5 border-t border-white/[0.06] bg-white/[0.01]">
                    <p className="text-[10px] text-white/20 text-center">{notifications.length} anuncio{notifications.length !== 1 ? 's' : ''}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="hidden sm:block w-px h-5 bg-white/[0.06]" />

          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
            {user.avatar && (
              <img src={user.avatar} alt="" className="w-[22px] h-[22px] rounded-full object-cover ring-1 ring-white/10" />
            )}
            <span className="text-white/85 text-[13px] font-semibold hidden md:inline">{user.name}</span>
          </div>
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border-none bg-transparent text-white/30 cursor-pointer text-[13px] font-medium transition-all duration-200 hover:text-white/70 hover:bg-white/[0.05]"
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Mobile sidebar overlay */}
        {showMobileSidebar && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMobileSidebar(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-64 z-50" style={{ animation: 'slide-in-left 0.2s ease-out' }}>
              <Sidebar activeTab={activeTab} onTabChange={handleTabChange} role={user.role} forceFull />
            </div>
          </div>
        )}
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <Sidebar activeTab={activeTab} onTabChange={handleTabChange} role={user.role} />
        </div>
        <main className="flex-1 relative overflow-auto min-h-0" style={{ animation: 'fade-in 0.3s ease' }}>
          <ActiveView />
        </main>
      </div>
    </div>
  );
}
