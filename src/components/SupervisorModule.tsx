import { Supervisor, FarmMapRecord } from '../types';
import { 
  UserCheck, 
  MapPin, 
  Plus, 
  Download,
  Lightbulb,
  AlertTriangle,
  Layers,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { ThemeConfig, getSupervisorTheme } from '../utils/theme';

interface SupervisorModuleProps {
  supervisors: Supervisor[];
  farmMaps: FarmMapRecord[];
  selectedSupervisorId: string | null;
  currentTheme: ThemeConfig;
  onSelectSupervisor: (id: string) => void;
  onOpenAddMapForSupervisor: (supervisor: Supervisor) => void;
  onOpenConsolidatedPdfForSupervisor: (supervisor: Supervisor) => void;
  onQuickDownloadPdf?: (supervisorId: string) => void;
  onOpenAddSupervisor: () => void;
}

export function SupervisorModule({
  supervisors,
  farmMaps,
  selectedSupervisorId,
  currentTheme,
  onSelectSupervisor,
  onOpenAddMapForSupervisor,
  onOpenConsolidatedPdfForSupervisor,
  onQuickDownloadPdf,
  onOpenAddSupervisor,
}: SupervisorModuleProps) {
  // Find current active supervisor
  const activeSupervisor = supervisors.find((s) => s.id === selectedSupervisorId) || supervisors[0];

  // Calculate isolated lamp statistics for the active supervisor only
  const activeSupervisorMaps = farmMaps.filter(
    (m) => m.supervisorId === activeSupervisor?.id
  );

  const totalActiveLights = activeSupervisorMaps.reduce(
    (acc, m) => acc + (m.nightInspection?.totalActiveLights || 0),
    0
  );

  const totalDamagedLights = activeSupervisorMaps.reduce(
    (acc, m) => acc + (m.nightInspection?.totalDamagedLights || 0),
    0
  );

  const totalLamps = totalActiveLights + totalDamagedLights;
  const overallCoverage = totalLamps > 0 
    ? Math.round((totalActiveLights / totalLamps) * 1000) / 10 
    : 100;

  return (
    <section id="supervisores-section" className="py-2 space-y-4">
      {/* Selector de Interfaces de Supervisores (Separación estricta Ronnie vs Jason) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <span className="text-xs text-slate-500 font-medium block mb-0.5">
              Selecciona la interfaz del supervisor
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Interfaces de Supervisores DOLE
            </h2>
          </div>

          <button
            id="btn-add-supervisor-section"
            onClick={onOpenAddSupervisor}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5 text-slate-500" />
            <span>Nuevo Supervisor</span>
          </button>
        </div>

        {/* Pestañas de Interfaz: Ronnie Flores y Jason Cruz (Completamente independientes) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {supervisors.map((supervisor) => {
            const isSelected = activeSupervisor?.id === supervisor.id;
            const supMaps = farmMaps.filter((m) => m.supervisorId === supervisor.id);
            const isPineapple = supervisor.category.includes('Piña');
            const supTheme = getSupervisorTheme(supervisor.category);

            // Supervisor's isolated lamp counts
            const supActiveLights = supMaps.reduce(
              (acc, m) => acc + (m.nightInspection?.totalActiveLights || 0),
              0
            );
            const supDamagedLights = supMaps.reduce(
              (acc, m) => acc + (m.nightInspection?.totalDamagedLights || 0),
              0
            );

            return (
              <button
                key={supervisor.id}
                id={`btn-tab-interface-${supervisor.id}`}
                type="button"
                onClick={() => onSelectSupervisor(supervisor.id)}
                className={`text-left p-4 rounded-xl border-2 transition-all duration-200 relative cursor-pointer ${
                  isSelected
                    ? `${supTheme.cardActiveBorder} ${supTheme.primaryLightBg} shadow-sm ring-2`
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0 shadow-xs ${
                        isSelected ? supTheme.primaryBg : 'bg-slate-700'
                      }`}
                    >
                      {isPineapple ? '🍍' : '🍌'}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-sm sm:text-base text-slate-900 leading-tight">
                          Interfaz de {supervisor.name}
                        </h3>
                        {isSelected && (
                          <span className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-800 shadow-2xs">
                            <UserCheck className="w-3 h-3 text-emerald-600" />
                            ACTIVA
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-medium">
                        {supervisor.category} • <span className="font-mono text-[11px]">{supervisor.employeeCode}</span>
                      </p>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border shrink-0 ${
                    isPineapple 
                      ? 'bg-amber-100 text-amber-900 border-amber-300' 
                      : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  }`}>
                    {isPineapple ? 'Piña & Banano' : 'Banano'}
                  </span>
                </div>

                {/* Fincas del supervisor */}
                <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-600 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {supMaps.length} {supMaps.length === 1 ? 'Finca asignada' : 'Fincas asignadas'}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {isSelected ? '✓ Interfaz Seleccionada' : 'Clic para entrar'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Estado de la Interfaz Activa */}
        {activeSupervisor && (
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-500">
                Interfaz seleccionada: <strong className="text-slate-900 font-bold">{activeSupervisor.name}</strong>
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${currentTheme.badgeBg}`}>
                {currentTheme.label}
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

