import { useNavigate } from 'react-router-dom';
import TopNavbar from '../components/layout/TopNavbar';
import {
  LogIn,
  Code2,
  BrainCircuit,
  Terminal,
  MessageSquareText,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  GitBranch,
  Play,
  ChevronRight,
  GraduationCap,
  BookOpen,
  Users
} from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();

  const navOptions = (
    <div className="flex items-center gap-1">
      <a href="#features" className="hidden sm:block px-3 py-1.5 text-[13px] text-[var(--upt-text-secondary)] hover:text-[var(--upt-text-primary)] transition-colors duration-200 rounded-lg hover:bg-[var(--upt-surface-light)]">
        Características
      </a>
      <a href="#method" className="hidden sm:block px-3 py-1.5 text-[13px] text-[var(--upt-text-secondary)] hover:text-[var(--upt-text-primary)] transition-colors duration-200 rounded-lg hover:bg-[var(--upt-surface-light)]">
        Método
      </a>
      <div className="hidden sm:block w-px h-4 bg-[var(--upt-surface-border)] mx-2" />
      <button
        onClick={() => navigate('/auth')}
        className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold text-[var(--upt-navy)] bg-[var(--upt-gold)] hover:bg-[var(--upt-gold-light)] rounded-lg transition-all duration-300 hover:shadow-[var(--upt-shadow-glow-gold)] cursor-pointer border-none"
      >
        <LogIn className="w-3.5 h-3.5" />
        Ingresar
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--upt-bg)]">
      <TopNavbar rightElements={navOptions} />

      <section className="relative pt-14 overflow-hidden bg-[var(--upt-bg)]">
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          <div className="absolute top-[6%] right-[10%] w-64 h-64 bg-[var(--upt-gold)]/[0.03] rounded-full blur-[80px]" />
          <div className="absolute bottom-[10%] left-[5%] w-80 h-80 bg-[var(--upt-accent)]/[0.04] rounded-full blur-[100px]" />
          <div className="absolute inset-0 bg-dot-pattern opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--upt-bg)]" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div style={{ animation: 'fade-up 0.6s ease-out' }}>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 mb-8 rounded-full border border-[var(--upt-gold)]/15 bg-[var(--upt-gold)]/[0.06] text-[var(--upt-gold)] text-[11px] font-semibold tracking-[0.08em] uppercase">
                <Sparkles className="w-3 h-3" />
                Escuela de Ingeniería de Sistemas · UPT
              </div>

              <h1 className="text-[2.2rem] sm:text-[2.8rem] md:text-[3.2rem] lg:text-[3.8rem] font-extrabold text-[var(--upt-text-primary)] tracking-tight leading-[1.08] mb-6">
                Aprende a{' '}
                <br className="hidden sm:block" />
                programar{' '}
                <span className="relative inline-block">
                  <span className="text-[var(--upt-gold)]">razonando.</span>
                  <span className="absolute -bottom-1.5 left-0 w-full h-1 bg-[var(--upt-gold)]/25 rounded-full" />
                </span>
              </h1>

              <p className="text-[15px] sm:text-[17px] text-[var(--upt-text-secondary)] max-w-md mb-10 leading-[1.75]">
                Un tutor virtual con inteligencia artificial que emplea el método Socrático para guiarte a descubrir soluciones por ti mismo.
              </p>

              <div className="flex flex-wrap gap-3 mb-10">
                <button
                  onClick={() => navigate('/auth')}
                  className="group flex items-center justify-center gap-2.5 px-7 min-h-[44px] bg-[var(--upt-gold)] text-[var(--upt-navy)] font-bold text-sm rounded-xl hover:bg-[var(--upt-gold-light)] transition-all duration-300 cursor-pointer border-none shadow-[var(--upt-shadow-md)] hover:shadow-[var(--upt-shadow-glow-gold)] hover:-translate-y-0.5"
                >
                  Comenzar Ahora
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <a
                  href="#method"
                  className="flex items-center justify-center gap-2 px-6 min-h-[44px] bg-[var(--upt-surface)] border border-[var(--upt-surface-border)] text-[var(--upt-text-primary)] font-medium text-sm rounded-xl hover:bg-[var(--upt-surface-light)] hover:border-[var(--upt-text-tertiary)] transition-all duration-300"
                >
                  <Play className="w-3.5 h-3.5" />
                  ¿Cómo funciona?
                </a>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-6 text-[var(--upt-text-secondary)] text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-[var(--upt-gold)]" />
                  <span>Acceso con @virtual.upt.pe</span>
                </div>
                <div className="flex items-center gap-2">
                  <BrainCircuit className="w-3.5 h-3.5 text-[var(--upt-gold)]" />
                  <span>Método Socrático con IA</span>
                </div>
              </div>
            </div>

            <div className="hidden lg:block" style={{ animation: 'fade-up 0.8s ease-out 0.1s both' }}>
              <div className="relative">
                <div className="absolute -inset-6 bg-[var(--upt-gold)]/[0.03] rounded-3xl blur-3xl" />
                <div className="relative rounded-2xl overflow-hidden border border-[var(--upt-surface-border)] shadow-[var(--upt-shadow-lg)] bg-[var(--upt-surface)]">
                  <div className="flex items-center gap-2 px-4 py-3 bg-[var(--upt-bg-deep)] border-b border-[var(--upt-surface-border)]">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[var(--upt-error)]/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[var(--upt-warning)]/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[var(--upt-success)]/60" />
                    </div>
                    <span className="text-[10px] text-[var(--upt-text-tertiary)] ml-2 font-mono">main.cpp — ALDA IDE</span>
                  </div>
                  <div className="p-5 font-mono text-[13px] leading-[1.8]">
                    <pre className="text-[var(--upt-text-primary)]">
                      <span className="text-[#c792ea]">#include</span> <span className="text-[#c3e88d]">&lt;iostream&gt;</span>{'\n'}
                      <span className="text-slate-400">using namespace</span> std;{'\n'}
                      {'\n'}
                      <span className="text-[#82aaff]">int</span> <span className="text-[#c3e88d]">main</span>() {'{'}{'\n'}
                      <span className="text-[#c792ea]">for</span> (<span className="text-[#82aaff]">int</span> i = <span className="text-[#f78c6c]">0</span>; i &lt; <span className="text-[#f78c6c]">5</span>; i++) {'{'}{'\n'}
                      cout &lt;&lt; <span className="text-[#c3e88d]">"Hola Mundo"</span> &lt;&lt; endl;{'\n'}
                      {'}'}{'\n'}
                      <span className="text-[#c792ea]">return</span> <span className="text-[#f78c6c]">0</span>;{'\n'}
                      {'}'}</pre>
                  </div>
                  <div className="px-4 py-3 bg-[var(--upt-bg-deep)] border-t border-[var(--upt-surface-border)] text-[11px] text-[var(--upt-success)] font-mono">
                    ✓ Compilación exitosa — 0 errores
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 py-10 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <StatBadge icon={<GraduationCap className="w-4 h-4" />} value="Socrático" label="Método Pedagógico" />
            <StatBadge icon={<Code2 className="w-4 h-4" />} value="IDE Web" label="Editor Integrado" />
            <StatBadge icon={<BrainCircuit className="w-4 h-4" />} value="IA + RAG" label="Motor de Tutoría" />
            <StatBadge icon={<Users className="w-4 h-4" />} value="UPT" label="Para Estudiantes EPIS" />
          </div>
        </div>
      </section>

      <section id="features" className="py-28 px-6 bg-[var(--upt-bg-deep)] relative">
        <div className="absolute inset-0 bg-dot-pattern opacity-10 pointer-events-none" />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <span className="text-[11px] font-bold tracking-[0.12em] uppercase text-[var(--upt-gold)] mb-3 block">Plataforma</span>
            <h2 className="text-[1.6rem] sm:text-[2rem] md:text-[2.2rem] font-extrabold text-[var(--upt-text-primary)] mb-4 tracking-tight">Ecosistema de Aprendizaje</h2>
            <p className="text-[var(--upt-text-secondary)] max-w-lg mx-auto text-[15px] leading-relaxed">
              Herramientas integradas para transformar la forma en que resuelves problemas de programación.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard icon={<Code2 className="w-5 h-5" />} title="Editor de Código en Vivo" description="Escribe, compila y ejecuta tu código directamente en el navegador con un sandbox seguro." accent="blue" />
            <FeatureCard icon={<BrainCircuit className="w-5 h-5" />} title="Tutoría Socrática con IA" description="Un asistente que te guía con preguntas reflexivas en lugar de darte respuestas directas." accent="gold" />
            <FeatureCard icon={<Terminal className="w-5 h-5" />} title="Consola Integrada" description="Visualiza errores de compilación y la salida de tu programa en tiempo real." accent="emerald" />
            <FeatureCard icon={<MessageSquareText className="w-5 h-5" />} title="Turno de Reflexión" description="Describe tu intención y enfoque antes de recibir ayuda para desarrollar pensamiento crítico." accent="amber" />
            <FeatureCard icon={<GitBranch className="w-5 h-5" />} title="Historial de Versiones" description="Guarda capturas de tu código en cualquier momento y navega entre versiones anteriores." accent="purple" />
            <FeatureCard icon={<ShieldCheck className="w-5 h-5" />} title="Acceso Institucional" description="Autenticación segura con tu cuenta @virtual.upt.pe mediante Google." accent="rose" />
          </div>
        </div>
      </section>

      <section id="method" className="py-28 px-6 bg-[var(--upt-bg)] relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--upt-accent)]/[0.02] rounded-full blur-[150px]" />
        </div>
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <span className="text-[11px] font-bold tracking-[0.12em] uppercase text-[var(--upt-gold)] mb-3 block">Pedagogía</span>
            <h2 className="text-[1.6rem] sm:text-[2rem] md:text-[2.2rem] font-extrabold text-[var(--upt-text-primary)] mb-4 tracking-tight">El Ciclo Socrático</h2>
            <p className="text-[var(--upt-text-secondary)] max-w-lg mx-auto text-[15px] leading-relaxed">
              Tres pasos que transforman errores en oportunidades de aprendizaje profundo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            <StepCard number="01" title="Escribe tu código" description="Trabaja en tu solución dentro del editor integrado. Ejecuta y observa los resultados." isFirst />
            <StepCard number="02" title="Reflexiona" description="El tutor te hará preguntas sobre tu intención y enfoque antes de darte pistas." />
            <StepCard number="03" title="Descubre" description="A través de las preguntas guía llegarás a la respuesta por tu propio razonamiento." isLast />
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-[var(--upt-bg-deep)] text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[var(--upt-gold)]/[0.03] rounded-full blur-[120px]" />
        </div>
        <div className="max-w-xl mx-auto relative z-10" style={{ animation: 'fade-up 0.5s ease-out' }}>
          <BookOpen className="w-8 h-8 text-[var(--upt-gold)] opacity-70 mx-auto mb-5" />
          <h3 className="text-[1.4rem] sm:text-[1.7rem] font-extrabold text-[var(--upt-text-primary)] mb-3 tracking-tight">¿Listo para empezar?</h3>
          <p className="text-[var(--upt-text-secondary)] text-sm mb-8 leading-relaxed">
            Accede con tu cuenta institucional y comienza tu primera práctica guiada.
          </p>
          <button
            onClick={() => navigate('/auth')}
            className="group inline-flex items-center justify-center gap-2 px-8 min-h-[44px] bg-[var(--upt-gold)] text-[var(--upt-navy)] font-bold text-sm rounded-xl hover:bg-[var(--upt-gold-light)] transition-all duration-300 cursor-pointer border-none shadow-[var(--upt-shadow-md)] hover:shadow-[var(--upt-shadow-glow-gold)] hover:-translate-y-0.5"
          >
            Acceder a ALDA
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </section>

      <footer className="py-10 px-6 bg-[var(--upt-bg-deep)] text-center border-t border-[var(--upt-surface-border)]">
        <p className="text-[12px] text-[var(--upt-text-tertiary)]">
          ALDA — AI-based Learning & Development Assistant · Universidad Privada de Tacna · 2026
        </p>
      </footer>
    </div>
  );
}

function StatBadge({ icon, value, label }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-[var(--upt-surface)] border border-[var(--upt-surface-border)] hover:bg-[var(--upt-surface-light)] hover:border-[var(--upt-text-tertiary)] transition-all duration-300 group">
      <div className="text-[var(--upt-gold)]/80 group-hover:text-[var(--upt-gold)] transition-colors">{icon}</div>
      <div>
        <div className="text-sm font-bold text-[var(--upt-text-primary)]">{value}</div>
        <div className="text-[10px] text-[var(--upt-text-secondary)]">{label}</div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description, accent }) {
  const styles = {
    blue: { bg: 'bg-[var(--upt-info)]/10', text: 'text-[var(--upt-info)]', border: 'border-[var(--upt-info)]/20', hover: 'hover:border-[var(--upt-info)]/40' },
    gold: { bg: 'bg-[var(--upt-warning)]/10', text: 'text-[var(--upt-warning)]', border: 'border-[var(--upt-warning)]/20', hover: 'hover:border-[var(--upt-warning)]/40' },
    emerald: { bg: 'bg-[var(--upt-success)]/10', text: 'text-[var(--upt-success)]', border: 'border-[var(--upt-success)]/20', hover: 'hover:border-[var(--upt-success)]/40' },
    amber: { bg: 'bg-[var(--upt-gold)]/10', text: 'text-[var(--upt-gold)]', border: 'border-[var(--upt-gold)]/20', hover: 'hover:border-[var(--upt-gold)]/40' },
    purple: { bg: 'bg-[var(--upt-accent)]/10', text: 'text-[var(--upt-accent)]', border: 'border-[var(--upt-accent)]/20', hover: 'hover:border-[var(--upt-accent)]/40' },
    rose: { bg: 'bg-[var(--upt-error)]/10', text: 'text-[var(--upt-error)]', border: 'border-[var(--upt-error)]/20', hover: 'hover:border-[var(--upt-error)]/40' },
  };
  const s = styles[accent] || styles.blue;

  return (
    <div className={`group p-7 rounded-2xl bg-[var(--upt-surface)] border border-[var(--upt-surface-border)] hover:bg-[var(--upt-surface-light)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--upt-shadow-lg)] cursor-default`}>
      <div className={`w-11 h-11 rounded-xl ${s.bg} ${s.text} flex items-center justify-center mb-5 transition-all duration-300 border ${s.border}`}>
        {icon}
      </div>
      <h3 className="text-[15px] font-bold text-[var(--upt-text-primary)] mb-2">{title}</h3>
      <p className="text-[14px] text-[var(--upt-text-tertiary)] leading-[1.7]">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description, isFirst, isLast }) {
  return (
    <div className="relative flex flex-col items-center text-center px-8 py-10">
      {!isFirst && (
        <div className="hidden md:block absolute top-[52px] -left-0 w-full h-px bg-gradient-to-r from-transparent via-[var(--upt-surface-border)] to-transparent" />
      )}
      <div className="relative z-10 w-14 h-14 rounded-2xl bg-[var(--upt-surface)] border border-[var(--upt-surface-border)] flex items-center justify-center text-[var(--upt-gold)] text-sm font-bold mb-6 shadow-[var(--upt-shadow-md)]">
        {number}
      </div>
      <h3 className="text-[16px] font-bold text-[var(--upt-text-primary)] mb-2.5">{title}</h3>
      <p className="text-[14px] text-[var(--upt-text-tertiary)] leading-[1.7] max-w-[240px]">{description}</p>
    </div>
  );
}
