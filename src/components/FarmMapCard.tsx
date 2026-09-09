import { useState, useEffect, useRef } from 'react';
import { FarmMapRecord } from '../types';
import { 
  Calendar, 
  User, 
  Trash2, 
  Maximize2, 
  X, 
  Check, 
  FileText, 
  FileEdit, 
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { ThemeConfig } from '../utils/theme';

interface FarmMapCardProps {
  key?: string;
  mapRecord: FarmMapRecord;
  theme?: ThemeConfig;
  isPdfSentOrDownloaded?: boolean;
  onDownloadSinglePdf?: (mapRecord: FarmMapRecord) => void;
  onDelete: (id: string) => void;
  onUpdateMap?: (updatedRecord: FarmMapRecord) => void;
  onUpdateNotes?: (mapId: string, notes: string) => void;
}

export function FarmMapCard({
  mapRecord,
  theme: _theme,
  isPdfSentOrDownloaded: _isPdfSentOrDownloaded = false,
  onDownloadSinglePdf: _onDownloadSinglePdf,
  onDelete,
  onUpdateMap,
  onUpdateNotes,
}: FarmMapCardProps) {
  const [showFullImage, setShowFullImage] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const isPineapple = mapRecord.cropCategory.includes('Piña');

  // Strip predefined "Operación nocturna en" if present
  const getCleanInitialNotes = (rawNotes?: string) => {
    if (!rawNotes) return '';
    if (rawNotes.trim().startsWith('Operación nocturna')) return '';
    return rawNotes;
  };

  // Inspection notes written by the user
  const [lampNotes, setLampNotes] = useState<string>(() =>
    getCleanInitialNotes(mapRecord.nightInspection?.observations)
  );
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestNotesRef = useRef<string>(lampNotes);
  latestNotesRef.current = lampNotes;

  // IMPORTANT: Only re-sync lampNotes if the map ID changes (different card)
  // Never re-sync on every re-render of mapRecord, which was causing keystrokes to be erased!
  useEffect(() => {
    const clean = getCleanInitialNotes(mapRecord.nightInspection?.observations);
    setLampNotes(clean);
    latestNotesRef.current = clean;
  }, [mapRecord.id]);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Auto-cancel confirmation after 4 seconds
  useEffect(() => {
    if (!isConfirmingDelete) return;
    const timer = setTimeout(() => setIsConfirmingDelete(false), 4000);
    return () => clearTimeout(timer);
  }, [isConfirmingDelete]);

  // Display the sanitized renamed filename based on photo title
  const displayFileName = mapRecord.imageFileName || `${mapRecord.farmName.replace(/\s+/g, '_')}.png`;

  // Persist notes immediately without bouncing
  const persistNotes = (text: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    setIsSavingNotes(true);

    if (onUpdateNotes) {
      onUpdateNotes(mapRecord.id, text);
    } else if (onUpdateMap) {
      onUpdateMap({
        ...mapRecord,
        nightInspection: {
          ...mapRecord.nightInspection,
          observations: text,
        },
        dayInspection: {
          ...mapRecord.dayInspection,
          observations: text,
        },
        updatedAt: Date.now(),
      });
    }

    setTimeout(() => {
      setIsSavingNotes(false);
    }, 300);
  };

  // Smooth typing handler: updates text instantly and debounces storage save
  const handleNotesChange = (val: string) => {
    setLampNotes(val);
    latestNotesRef.current = val;
    setIsSavingNotes(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      persistNotes(val);
    }, 450);
  };

  // Guaranteed immediate save on blur
  const handleNotesBlur = () => {
    persistNotes(latestNotesRef.current);
  };

  const hasEditedDialogue = lampNotes.trim().length > 0;

  return (
    <>
      <div 
        id={`farm-map-card-${mapRecord.id}`}
        className={`bg-white p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
          hasEditedDialogue 
            ? 'border-slate-200 shadow-xs hover:shadow-sm' 
            : 'border-rose-200 ring-1 ring-rose-300/40 bg-rose-50/20 shadow-xs'
        }`}
      >
        <div>
          {/* Header con nombre de finca y validación visual */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide truncate" title={mapRecord.farmName}>
              {mapRecord.farmName}
            </h3>
            
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Validación visual de inclusión/omisión en el consolidado */}
              {hasEditedDialogue ? (
                <span 
                  className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1"
                  title="Esta finca tiene anotación y se adjuntará al reporte consolidado"
                >
                  <Check className="w-3 h-3 text-emerald-700" />
                  <span>En Reporte</span>
                </span>
              ) : (
                <span 
                  className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1 animate-pulse"
                  title="Omitida del PDF consolidado: falta editar el cuadro de diálogo"
                >
                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                  <span>Omitida</span>
                </span>
              )}

              <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${
                isPineapple 
                  ? 'bg-amber-100 text-amber-800' 
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {isPineapple ? 'Piña & Banano' : 'Banano'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium mb-3">
            <span className="flex items-center gap-1 font-semibold text-slate-700">
              <User className="w-3.5 h-3.5 text-slate-400" />
              {mapRecord.supervisorName}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {mapRecord.inspectionDate}
            </span>
          </div>

          {/* Vista previa del Mapa (Imagen) - Sin leyendas superpuestas sobre la imagen */}
          <div 
            onClick={() => setShowFullImage(true)}
            className="aspect-video bg-slate-100 rounded-lg border border-slate-200 flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer"
          >
            <img
              src={mapRecord.imageDataUrl}
              alt={`Mapa de ${mapRecord.farmName}`}
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
            />
            <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="px-2.5 py-1 rounded-md bg-white/95 text-slate-900 text-xs font-bold flex items-center gap-1.5 shadow-xs">
                <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
                Ver Foto Completa
              </span>
            </div>
          </div>

          {/* CUADRO DE ANOTACIONES DE INSPECCIÓN DEBAJO DE LA IMAGEN */}
          <div className={`mt-3 p-3 rounded-xl border space-y-2 transition-all ${
            hasEditedDialogue 
              ? 'bg-slate-50 border-slate-200' 
              : 'bg-rose-50/60 border-rose-200 ring-1 ring-rose-300/20'
          }`}>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wide">
                <FileEdit className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Anotaciones de la Inspección</span>
              </label>
              {isSavingNotes ? (
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded flex items-center gap-1">
                  <Loader2 className="w-3 h-3 text-blue-600 animate-spin" />
                  <span>Guardando...</span>
                </span>
              ) : hasEditedDialogue ? (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>Guardado</span>
                </span>
              ) : (
                <span className="text-[10px] font-bold text-rose-800 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded flex items-center gap-1">
                  <span>Sin editar (Omitida)</span>
                </span>
              )}
            </div>

            <textarea
              id={`textarea-notes-${mapRecord.id}`}
              rows={3}
              value={lampNotes}
              onChange={(e) => handleNotesChange(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="Escriba aquí las observaciones de la inspección técnica para adjuntarla al consolidado..."
              className={`w-full text-base font-bold text-slate-900 bg-white rounded-lg p-3 placeholder:text-slate-400 placeholder:font-normal placeholder:text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 resize-none transition-all shadow-2xs leading-relaxed border ${
                hasEditedDialogue ? 'border-slate-300' : 'border-rose-200 focus:border-rose-400'
              }`}
            />

            {!hasEditedDialogue && (
              <p className="text-[11px] text-rose-800 font-semibold flex items-center gap-1 pt-0.5">
                <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                <span>Omitida del PDF: completa este cuadro para adjuntar la finca.</span>
              </p>
            )}
          </div>
        </div>

        {/* Acciones de la Tarjeta */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-medium">
            {hasEditedDialogue ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[11px] text-emerald-800 font-bold">Adjunta al PDF Consolidado</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span className="text-[11px] text-rose-800 font-bold">Omitida del PDF (Sin editar)</span>
              </>
            )}
          </div>

          {isConfirmingDelete ? (
            <div className="flex items-center gap-1 animate-in fade-in duration-100">
              <button
                id={`btn-confirm-delete-${mapRecord.id}`}
                onClick={() => {
                  onDelete(mapRecord.id);
                  setIsConfirmingDelete(false);
                }}
                className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-md shadow-xs transition-colors flex items-center gap-1"
                title="Confirmar eliminación permanente"
              >
                <Trash2 className="w-3.5 h-3.5 text-white" />
                <span>¿Eliminar?</span>
              </button>
              <button
                onClick={() => setIsConfirmingDelete(false)}
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Cancelar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              id={`btn-delete-map-${mapRecord.id}`}
              onClick={() => setIsConfirmingDelete(true)}
              className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Eliminar Mapa de la Finca"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Modal de Imagen Completa */}
      {showFullImage && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowFullImage(false)}
        >
          <div 
            className="bg-white rounded-xl max-w-4xl w-full p-4 space-y-3 shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">{mapRecord.farmName}</h3>
                <p className="text-xs text-slate-500 font-mono">Archivo: {displayFileName}</p>
              </div>
              <button 
                onClick={() => setShowFullImage(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center">
              <img 
                src={mapRecord.imageDataUrl} 
                alt={mapRecord.farmName}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

