import { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, Users, MapPin, FileSpreadsheet } from 'lucide-react';

export function ScrollNavigation() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('hero');

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 200);

      const sections = ['hero-section', 'supervisores-section', 'mapas-section', 'reportes-section'];
      const scrollPos = window.scrollY + 200;

      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  return (
    <aside aria-label="Navegación rápida de desplazamiento" className="fixed bottom-5 right-4 sm:right-6 z-30 flex flex-col items-center gap-1.5 bg-white/95 backdrop-blur-xs p-1.5 rounded-xl shadow-md border border-slate-200">
      {/* Scroll to top */}
      <button
        id="scroll-to-top-btn"
        onClick={scrollToTop}
        title="Desplazar al inicio"
        aria-label="Desplazar al inicio"
        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
          showScrollTop
            ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            : 'opacity-40 cursor-not-allowed text-slate-400'
        }`}
      >
        <ChevronUp className="w-4 h-4" />
      </button>

      {/* Section Buttons */}
      <div className="w-5 h-px bg-slate-200 my-0.5" />

      <button
        id="scroll-to-supervisors-btn"
        onClick={() => scrollTo('supervisores-section')}
        title="Ir a Supervisores"
        aria-label="Ir a sección de Supervisores"
        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
          activeSection === 'supervisores-section'
            ? 'bg-blue-600 text-white shadow-2xs'
            : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        <Users className="w-4 h-4" />
      </button>

      <button
        id="scroll-to-maps-btn"
        onClick={() => scrollTo('mapas-section')}
        title="Ir a Mapas de Fincas"
        aria-label="Ir a sección de Mapas de Fincas"
        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
          activeSection === 'mapas-section'
            ? 'bg-blue-600 text-white shadow-2xs'
            : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        <MapPin className="w-4 h-4" />
      </button>

      <button
        id="scroll-to-reports-btn"
        onClick={() => scrollTo('reportes-section')}
        title="Ir a Cúmulo de Reportes"
        aria-label="Ir a sección de Cúmulo de Reportes"
        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
          activeSection === 'reportes-section'
            ? 'bg-blue-600 text-white shadow-2xs'
            : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        <FileSpreadsheet className="w-4 h-4" />
      </button>

      <div className="w-5 h-px bg-slate-200 my-0.5" />

      {/* Scroll to bottom */}
      <button
        id="scroll-to-bottom-btn"
        onClick={scrollToBottom}
        title="Desplazar al final"
        aria-label="Desplazar al final"
        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all"
      >
        <ChevronDown className="w-4 h-4" />
      </button>
    </aside>
  );
}
