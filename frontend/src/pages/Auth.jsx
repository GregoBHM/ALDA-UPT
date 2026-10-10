import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Loader2, Mail } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { authLogin } from '../api';
import logoPng from '../assets/logo.png';

export default function Auth() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoogleSuccess = async (credentialResponse) => {
    if (isSubmitting) return;
    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${credentialResponse.access_token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch Google user info');
      
      const userInfo = await res.json();
      const userEmail = userInfo.email;

      try {
        const sessionUser = await authLogin(
          userEmail,
          userInfo.name || 'Estudiante UPT',
          userInfo.picture
        );

        sessionStorage.setItem('user', JSON.stringify({
          ...sessionUser,
          avatar: sessionUser.avatar_url
        }));

        toast.success(`Bienvenido ${sessionUser.name}`);
        navigate('/dashboard');      } catch (backendErr) {
        const msg = backendErr.message || '';
        const isAccessDenied =
          msg.includes('institucionales') ||
          msg.includes('autorizados') ||
          msg.includes('403') ||
          msg.includes('acceso') ||
          msg.includes('Ingenier') ||
          msg.includes('BANNED') ||
          msg.includes('verificar') ||
          msg.includes('verificaci');
        if (isAccessDenied) {
          setError(msg || 'Tu correo no está autorizado para acceder a ALDA. Solicita al administrador que te añada.');
          toast.error('Acceso denegado');
        } else if (msg.includes('404') || msg.includes('no encontrado')) {
          setError('No se encontró tu cuenta. Contacta al administrador del sistema.');
          toast.error('Cuenta no encontrada');
        } else {
          setError('No se pudo conectar con el servidor de ALDA. Verifica tu conexión a internet e inténtalo de nuevo.');
          toast.error('Error de conexión');
        }
        setIsSubmitting(false);
      }

    } catch (err) {
      setError('Hubo un problema al procesar tu inicio de sesión con Google. Inténtalo de nuevo.');
      toast.error('Error de autenticación');
      setIsSubmitting(false);
    }
  };

  const handleGoogleError = () => {
    if (isSubmitting) return;
    setError('La ventana de Google se cerró o falló. Inténtalo de nuevo.');
    toast.error('Inicio de sesión cancelado.');
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: handleGoogleError,
  });

  return (
    <div className="min-h-screen bg-[var(--upt-bg)] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none select-none">
        <div className="absolute top-[6%] right-[10%] w-72 h-72 bg-[var(--upt-gold)]/[0.03] rounded-full blur-[100px]" />
        <div className="absolute bottom-[10%] left-[8%] w-60 h-60 bg-[var(--upt-accent)]/[0.04] rounded-full blur-[80px]" />
        <div className="absolute inset-0 bg-dot-pattern opacity-30" />
      </div>

      <div className="w-full max-w-[420px] relative z-10" style={{ animation: 'fade-up 0.5s ease-out' }}>
        <div className="rounded-2xl shadow-[var(--upt-shadow-lg)] overflow-hidden border border-[var(--upt-surface-border)] bg-[var(--upt-surface)]">
          <div className="px-8 pt-10 pb-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--upt-gold)]/[0.04] to-transparent pointer-events-none" />
            <img src={logoPng} alt="ALDA Logo" className="h-16 w-auto mx-auto object-contain drop-shadow-2xl mb-3 relative z-10" />
            <div className="w-12 h-0.5 bg-[var(--upt-gold)]/30 mx-auto rounded-full" />
          </div>

          <div className="px-8 py-10 relative border-t border-[var(--upt-surface-border)]">
            <h2 className="text-xl font-extrabold text-[var(--upt-text-primary)] mb-1.5 text-center tracking-tight">
              Acceso a la Plataforma
            </h2>
            <p className="text-[13px] text-[var(--upt-text-tertiary)] text-center mb-8 leading-relaxed">
              Utiliza tu cuenta institucional de Google Workspace para ingresar al entorno de tutoría.
            </p>

            {error && (
              <div className="mb-6 p-4 bg-[var(--upt-error)]/10 border border-[var(--upt-error)]/20 text-[var(--upt-error)] text-[13px] rounded-xl flex items-start gap-3" style={{ animation: 'scale-in 0.2s ease-out' }}>
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-[var(--upt-error)] opacity-90" />
                <span className="leading-relaxed font-medium opacity-90">{error}</span>
              </div>
            )}

            <div className="flex justify-center mt-2 mb-4 min-h-[44px]">
              {isSubmitting ? (
                <div className="flex items-center gap-2.5 text-[var(--upt-text-primary)] bg-[var(--upt-surface)] px-6 py-2.5 rounded-xl w-full justify-center border border-[var(--upt-surface-border)]">
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--upt-accent)]" />
                  <span className="text-[13px] font-semibold text-[var(--upt-text-tertiary)]">Conectando al servidor...</span>
                </div>
              ) : (
                <button
                  onClick={() => loginWithGoogle()}
                  className="group relative flex items-center justify-center gap-3 w-full bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 hover:border-gray-300 px-6 py-3 rounded-xl transition-all duration-300 shadow-sm overflow-hidden font-medium"
                >
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <svg className="w-5 h-5 relative z-10" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span className="text-[14px] font-semibold relative z-10">Iniciar sesión con Google</span>
                </button>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-[var(--upt-surface-border)]">
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[var(--upt-bg)] border border-[var(--upt-surface-border)]">
                <Mail className="w-4 h-4 text-[var(--upt-accent)] shrink-0 mt-0.5" />
                <p className="text-[11px] text-[var(--upt-text-tertiary)] leading-relaxed">
                  Solo los correos <span className="font-bold text-[var(--upt-text-primary)]">@virtual.upt.pe</span> o correos autorizados por administración pueden acceder a ALDA.
                </p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate('/')}
          className="mt-6 min-h-[44px] flex items-center justify-center gap-2 mx-auto text-[13px] text-[var(--upt-text-secondary)] hover:text-[var(--upt-text-primary)] transition-colors duration-200 disabled:opacity-30 bg-transparent border-none cursor-pointer"
          disabled={isSubmitting}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver al inicio
        </button>
      </div>
    </div>
  );
}
