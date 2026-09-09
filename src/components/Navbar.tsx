import { useState } from 'react';
import { 
  Users, 
  MapPin, 
  PlusCircle, 
  Loader2, 
  Menu, 
  X,
  Layers,
  HelpCircle,
  History,
  LogOut,
  Lightbulb
} from 'lucide-react';
import { ThemeConfig } from '../utils/theme';
import { Supervisor, AppUser } from '../types';

interface NavbarProps {
  activeTab: 'all' | 'supervisors' | 'maps';
  setActiveTab: (tab: 'all' | 'supervisors' | 'maps') => void;
  theme: ThemeConfig;
  supervisors?: Supervisor[];
  selectedSupervisorId?: string | null;
  onSelectSupervisor?: (id: string) => void;
  selectedSupervisorName?: string | null;
  onOpenAddMap: () => void;
  onOpenBatchUpload: () => void;
  onOpenAddSupervisor: () => void;
  onOpenConsolidatedPdf: () => void;
  onQuickDownloadPdf?: () => void;
  isQuickDownloading?: boolean;
  totalMapsCount: number;
  totalSupervisorsCount: number;
  onOpenLogs?: () => void;
  onOpenHelp?: () => void;
  currentUser?: AppUser | null;
  onLogout?: () => void;
}

export function Navbar({
  activeTab,
  setActiveTab,
  theme,
  supervisors = [],
  selectedSupervisorId,
  onSelectSupervisor,
  selectedSupervisorName,
  onOpenAddMap,
  onOpenBatchUpload,
  onOpenAddSupervisor,
  onOpenConsolidatedPdf,
  onQuickDownloadPdf,
  isQuickDownloading = false,
  totalMapsCount,
  totalSupervisorsCount,
  onOpenLogs,
  onOpenHelp,
  currentUser,
  onLogout,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string, tab?: 'all' | 'supervisors' | 'maps') => {
    if (tab) setActiveTab(tab);
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 gap-4">
          {/* Logo y marca DOLE */}
          <div 
            onClick={() => scrollToSection('supervisores-section', 'supervisors')}
            className="flex items-center gap-2.5 cursor-pointer group select-none shrink-0"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-900 border border-slate-700 shadow-xs transition-colors duration-300">
              <Lightbulb className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-none">
                  Control de Iluminación
                </h1>
                {selectedSupervisorName && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border transition-colors ${theme.badgeBg}`}>
                    {selectedSupervisorName}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 font-medium hidden sm:block">
                Interfaces Separadas • Banano & Piña
              </span>
            </div>
          </div>

          {/* Selector de Interfaz Rápido en la Barra Superior */}
          <div className="hidden lg:flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200/80">
            {supervisors.map((sup) => {
              const isActive = sup.id === selectedSupervisorId;
              const isPineapple = sup.category.includes('Piña');

              return (
                <button
                  key={sup.id}
                  id={`nav-btn-interface-${sup.id}`}
                  onClick={() => onSelectSupervisor && onSelectSupervisor(sup.id)}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive 
                      ? isPineapple 
                        ? 'bg-amber-600 text-white shadow-xs' 
                        : 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <span>{isPineapple ? '🍍' : '🍌'}</span>
                  <span>Interfaz {sup.name.split(' ')[0]}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Acciones directas (Desktop) */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            {/* Botón de Ayuda explicativa */}
            <button
              id="header-btn-help"
              onClick={onOpenHelp}
              className="px-2.5 py-1.5 rounded-md border border-amber-200 bg-amber-50/80 hover:bg-amber-100 text-amber-900 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Guía fácil de cómo funciona la aplicación"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Ayuda</span>
            </button>

            {/* Botón de Registro de Conexiones */}
            <button
              id="header-btn-connection-logs"
              onClick={onOpenLogs}
              className="px-2.5 py-1.5 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Ver registro de quién se ha conectado a la aplicación"
            >
              <History className="w-3.5 h-3.5 text-blue-600" />
              <span>Conexiones</span>
            </button>

            {/* Botón Subir Mapas */}
            <button
              id="header-btn-upload-maps"
              onClick={onOpenBatchUpload}
              className={`px-3 py-1.5 rounded-md text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer ${theme.buttonBg}`}
              title="Subir imágenes de mapas o carpetas comprimidas .ZIP"
            >
              <Layers className="w-3.5 h-3.5 text-white" />
              <span>Subir Mapas (.ZIP)</span>
            </button>

            {/* Botón Salir / Cerrar Sesión */}
            {onLogout && (
              <button
                id="header-btn-logout"
                onClick={onLogout}
                className="px-2.5 py-1.5 rounded-md border border-red-200 bg-red-50/80 hover:bg-red-100 text-red-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Cerrar sesión y reiniciar anotaciones para la próxima jornada"
              >
                <LogOut className="w-3.5 h-3.5 text-red-600" />
                <span>Salir</span>
              </button>
            )}
          </div>

          {/* Menú móvil */}
          <div className="flex sm:hidden items-center gap-1.5">
            <button
              onClick={onOpenHelp}
              className="p-1.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs"
              title="Ayuda"
            >
              <HelpCircle className="w-4 h-4 text-amber-600" />
            </button>
            <button
              onClick={onOpenLogs}
              className="p-1.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs"
              title="Conexiones"
            >
              <History className="w-4 h-4 text-blue-600" />
            </button>
            <button
              onClick={onOpenBatchUpload}
              className={`p-1.5 rounded-md text-white text-xs ${theme.buttonBg}`}
              title="Subir Mapas o Carpeta .ZIP"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-md text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menú desplegable móvil */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-3">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Cambiar de Interfaz de Supervisor:
            </span>
            <div className="grid grid-cols-2 gap-2">
              {supervisors.map((sup) => {
                const isActive = sup.id === selectedSupervisorId;
                const isPineapple = sup.category.includes('Piña');
                return (
                  <button
                    key={sup.id}
                    onClick={() => {
                      if (onSelectSupervisor) onSelectSupervisor(sup.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`py-2 px-2.5 rounded-lg text-xs font-bold text-left flex items-center gap-2 border ${
                      isActive 
                        ? isPineapple ? 'bg-amber-600 text-white border-amber-700' : 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>{isPineapple ? '🍍' : '🍌'}</span>
                    <span className="truncate">{sup.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenHelp) onOpenHelp();
              }}
              className="py-2 bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold rounded-lg flex items-center justify-center gap-1"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Ayuda Fácil</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenLogs) onOpenLogs();
              }}
              className="py-2 bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg flex items-center justify-center gap-1"
            >
              <History className="w-3.5 h-3.5 text-blue-600" />
              <span>Conexiones</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenBatchUpload();
              }}
              className={`col-span-2 py-2 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 ${theme.buttonBg}`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>+ Subir Fotos o Carpeta .ZIP</span>
            </button>

            {onLogout && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="col-span-2 py-2 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-red-600" />
                <span>Cerrar Sesión / Salir del Sistema</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
