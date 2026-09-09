import { useState } from 'react';
import { FarmMapRecord } from '../types';
import { isFarmInspectionEdited } from '../utils/farmValidation';
import { 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  FileEdit, 
  Send, 
  Loader2, 
  FileText,
  Sparkles
} from 'lucide-react';

interface PendingFarmsModalProps {
  isOpen: boolean;
  onClose: () => void;
  supervisorName?: string;
  farmMaps: FarmMapRecord[];
  onSaveNote: (mapId: string, notes: string) => void;
  onGeneratePdfNow?: () => void;
}

export function PendingFarmsModal({
  isOpen,
  onClose,
  supervisorName,
  farmMaps,
  onSaveNote,
  onGeneratePdfNow,
}: PendingFarmsModalProps) {
  // Local state for edits in progress inside the modal
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});
  const [savingMapIds, setSavingMapIds] = useState<Record<string, boolean>>({});
  const [justSavedIds, setJustSavedIds] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const pendingMaps = farmMaps.filter((m) => !isFarmInspectionEdited(m));
  const readyMaps = farmMaps.filter(isFarmInspectionEdited);

  const handleTextChange = (mapId: string, value: string) => {
    setDraftNotes((prev) => ({ ...prev, [mapId]: value }));
  };

  const handleSaveAndInclude = async (map: FarmMapRecord) => {
    const textToSave = (draftNotes[map.id] ?? map.nightInspection?.observations ?? '').trim();
    if (!textToSave) {
      alert('Por favor escribe al menos una observación técnica antes de adjuntarla al reporte.');
      return;
    }

    setSavingMapIds((prev) => ({ ...prev, [map.id]: true }));
    try {
      await onSaveNote(map.id, textToSave);
      setJustSavedIds((prev) => ({ ...prev, [map.id]: true }));
      setTimeout(() => {
        setJustSavedIds((prev) => {
          const copy = { ...prev };
          delete copy[map.id];
          return copy;
        });
      }, 3000);
    } finally {
      setSavingMapIds((prev) => ({ ...prev, [map.id]: false }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="pending-modal-title"
        className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[90vh]"
      >
        {/* Encabezado */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-gradient-to-r from-rose-500/10 via-white to-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 id="pending-modal-title" className="font-bold text-base text-slate-900 leading-tight">
                Fincas Omitidas del Reporte Consolidado
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {supervisorName ? `Supervisor: ${supervisorName}` : 'Revisión técnica de fincas pendientes'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Cerrar ventana"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de validación visual de estatus */}
        <div className="px-6 py-3 bg-rose-50/90 border-b border-rose-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span className="font-bold text-rose-900">
              Regla de Calidad: El consolidado PDF solo adjunta fincas con anotación editada.
            </span>
          </div>

          <div className="flex items-center gap-2 font-semibold">
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
              {readyMaps.length} Listas para PDF
            </span>
            <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">
              {pendingMaps.length} Pendientes (Omitidas)
            </span>
          </div>
        </div>

        {/* Lista de Fincas */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {pendingMaps.length === 0 ? (
            <div className="py-12 text-center space-y-3 bg-emerald-50/50 rounded-xl border border-emerald-200 p-6">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-emerald-900">
                ¡Todas las fincas están anotadas y listas!
              </h3>
              <p className="text-xs text-emerald-700 max-w-md mx-auto">
                No hay fincas omitidas. Las {readyMaps.length} fincas registradas tienen su cuadro de diálogo completado y se adjuntarán completas al PDF unificado.
              </p>
              {onGeneratePdfNow && (
                <div className="pt-2">
                  <button
                    onClick={() => {
                      onClose();
                      onGeneratePdfNow();
                    }}
                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Generar PDF Consolidado Ahora</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Escribe la observación de inspección técnica en cada finca y haz clic en <strong>"Guardar y Reenviar al Reporte"</strong> para que se adjunte automáticamente al documento final:
              </p>

              {pendingMaps.map((map) => {
                const currentText = draftNotes[map.id] ?? (map.nightInspection?.observations || '');
                const isSaving = savingMapIds[map.id];
                const wasSaved = justSavedIds[map.id];

                return (
                  <div
                    key={map.id}
                    className="p-4 rounded-xl border-2 border-rose-200 bg-rose-50/40 hover:bg-rose-50/60 transition-all space-y-3"
                  >
                    {/* Fila superior: Foto y Datos */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-16 h-12 rounded-lg border border-slate-200 overflow-hidden shrink-0 bg-slate-100">
                          <img
                            src={map.imageDataUrl}
                            alt={map.farmName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-sm text-slate-900 truncate">
                              {map.farmName}
                            </h4>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300 shrink-0">
                              Omitida del PDF
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 block truncate">
                            {map.cropCategory} • {map.inspectionDate}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[11px] text-rose-700 font-semibold bg-rose-100/80 border border-rose-200/60 px-2 py-0.5 rounded">
                          Falta anotación
                        </span>
                      </div>
                    </div>

                    {/* Cuadro de diálogo de anotación con estilo profesional mediano y negrita */}
                    <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200">
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wide">
                        <FileEdit className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>Cuadro de Diálogo de la Inspección (Anotación):</span>
                      </label>

                      <textarea
                        rows={3}
                        value={currentText}
                        onChange={(e) => handleTextChange(map.id, e.target.value)}
                        placeholder="Ej: Se inspeccionaron luminarias del sector empaque y áreas periféricas. 2 luminarias requieren reposición de bombilla LED..."
                        className="w-full text-base font-bold text-slate-900 bg-white border border-slate-300 rounded-lg p-3 placeholder:text-slate-400 placeholder:font-normal placeholder:text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 resize-none transition-all shadow-2xs leading-relaxed"
                      />

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-slate-400">
                          El texto se incluirá en la ficha técnica de esta finca en el reporte.
                        </span>

                        <button
                          type="button"
                          onClick={() => handleSaveAndInclude(map)}
                          disabled={isSaving}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-xs hover:shadow transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Guardando...</span>
                            </>
                          ) : wasSaved ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>¡Guardada y Reenviada!</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              <span>Guardar y Reenviar al Reporte</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-600 font-medium">
            {pendingMaps.length > 0 ? (
              <span className="text-rose-800 font-semibold">
                ⚠️ {pendingMaps.length} {pendingMaps.length === 1 ? 'finca pendiente' : 'fincas pendientes'} de anotación.
              </span>
            ) : (
              <span className="text-emerald-700 font-semibold">
                ✓ Todas las fincas están adjuntas al reporte.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-white transition-colors"
            >
              Cerrar
            </button>
            {onGeneratePdfNow && readyMaps.length > 0 && (
              <button
                onClick={() => {
                  onClose();
                  onGeneratePdfNow();
                }}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Generar Consolidado ({readyMaps.length} fincas)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
