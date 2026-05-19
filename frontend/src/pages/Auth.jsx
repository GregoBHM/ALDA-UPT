import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Loader2, Mail } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
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
      const decoded = jwtDecode(credentialResponse.credential);
      const userEmail = decoded.email;

      try {
        const sessionUser = await authLogin(
          userEmail,
          decoded.name || 'Estudiante UPT',
          decoded.picture
        );

        sessionStorage.setItem('user', JSON.stringify({
          ...sessionUser,
          avatar: sessionUser.avatar_url
        }));

        toast.success(`Bienvenido ${sessionUser.name}`);
        navigate('/dashboard');

      } catch (backendErr) {
        const msg = backendErr.message || '';
        if (msg.includes('institucionales') || msg.includes('autorizados') || msg.includes('403')) {
          setError('Tu correo no está autorizado para acceder a ALDA. Si crees que es un error, solicita al administrador que te añada en "Accesos Especiales".');
          toast.error('Correo no autorizado');
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

  return (
    <div className="min-h-screen bg-[var(--upt-navy)] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none select-none">
        <div className="absolute top-[6%] right-[10%] w-72 h-72 bg-[var(--upt-gold)]/[0.03] rounded-full blur-[100px]" />
        <div className="absolute bottom-[10%] left-[8%] w-60 h-60 bg-[var(--upt-accent)]/[0.04] rounded-full blur-[80px]" />
        <div className="absolute inset-0 bg-dot-pattern opacity-30" />
      </div>

      <div className="w-full max-w-[420px] relative z-10" style={{ animation: 'fade-up 0.5s ease-out' }}>
        <div className="rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.5)] overflow-hidden border border-white/[0.08] bg-[var(--upt-surface)]">
          <div className="px-8 pt-10 pb-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--upt-gold)]/[0.04] to-transparent pointer-events-none" />
            <img src={logoPng} alt="ALDA Logo" className="h-16 w-auto mx-auto object-contain drop-shadow-2xl mb-3 relative z-10" />
            <div className="w-12 h-0.5 bg-[var(--upt-gold)]/30 mx-auto rounded-full" />
          </div>

          <div className="px-8 py-10 relative border-t border-white/[0.04]">
            <h2 className="text-xl font-extrabold text-[var(--upt-text-primary)] mb-1.5 text-center tracking-tight">
              Acceso a la Plataforma
            </h2>
            <p className="text-[13px] text-[var(--upt-text-tertiary)] text-center mb-8 leading-relaxed">
              Utiliza tu cuenta institucional de Google Workspace para ingresar al entorno de tutoría.
            </p>

            {error && (
              <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[13px] rounded-xl flex items-start gap-3" style={{ animation: 'scale-in 0.2s ease-out' }}>
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-400" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <div className="flex justify-center mt-2 mb-4 h-[44px]">
              {isSubmitting ? (
                <div className="flex items-center gap-2.5 text-white bg-white/[0.04] px-6 py-2.5 rounded-xl w-full justify-center border border-white/[0.08]">
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--upt-accent)]" />
                  <span className="text-[13px] font-semibold text-[var(--upt-text-tertiary)]">Conectando al servidor...</span>
                </div>
              ) : (
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  shape="rectangular"
                  theme="filled_black"
                  size="large"
                  locale="es"
                />
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-white/[0.06]">
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
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
          className="mt-6 flex items-center justify-center gap-2 mx-auto text-[13px] text-white/30 hover:text-white/60 transition-colors duration-200 disabled:opacity-30 bg-transparent border-none cursor-pointer"
          disabled={isSubmitting}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver al inicio
        </button>
      </div>
    </div>
  );
}
