import { useState, useEffect } from 'react';
import { Supervisor, FarmMapRecord } from '../types';
import { generateConsolidatedPdf } from '../services/pdfGenerator';
import { isFarmInspectionEdited } from '../utils/farmValidation';
import { 
  X, 
  FileText, 
  Download, 
  Share2, 
  Calendar, 
  User, 
  CheckSquare, 
  Square, 
  Sparkles, 
  Loader2, 
  Check, 
  Eye,
  AlertTriangle,
  FileEdit,
  Send,
  CheckCircle2
} from 'lucide-react';

interface ConsolidatedPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  supervisors: Supervisor[];
  farmMaps: FarmMapRecord[];
  initialSupervisor?: Supervisor | null;
  onUpdateNotes?: (mapId: string, notes: string) => void;
}

export function ConsolidatedPdfModal({
  isOpen,
  onClose,
  supervisors,
  farmMaps,
  initialSupervisor,
  onUpdateNotes,
}: ConsolidatedPdfModalProps) {
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<string>(
    initialSupervisor?.id || supervisors[0]?.id || ''
  );

  const currentSupervisor = supervisors.find((s) => s.id === selectedSupervisorId) || supervisors[0];

  // Available dates for this supervisor
  const supervisorMaps = farmMaps.filter((m) => m.supervisorId === selectedSupervisorId);
  const uniqueDates = Array.from(new Set(supervisorMaps.map((m) => m.inspectionDate))).sort().reverse();

  const [selectedDate, setSelectedDate] = useState<string>(
    uniqueDates[0] || new Date().toISOString().split('T')[0]
  );

  // Filtered maps for this supervisor
  const dateMaps = supervisorMaps.filter((m) => m.inspectionDate === selectedDate);
  const activeScopeMaps = dateMaps.length > 0 ? dateMaps : supervisorMaps;

  // Visual validation partitioning: Ready (edited dialogue) vs Omitted (unedited)
  const readyMaps = activeScopeMaps.filter(isFarmInspectionEdited);
  const omittedMaps = activeScopeMaps.filter((m) => !isFarmInspectionEdited(m));

  const [selectedMapIds, setSelectedMapIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'READY' | 'OMITTED'>('READY');

  // In-modal editing state for omitted farms
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});
  const [savingNotesMapId, setSavingNotesMapId] = useState<string | null>(null);
  const [justSavedMapId, setJustSavedMapId] = useState<string | null>(null);

  // Notes to add
  const [reportNotes, setReportNotes] = useState('');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);
  const [generatedFilename, setGeneratedFilename] = useState<string>('');
  const [shareSuccess, setShareSuccess] = useState(false);

  // Sync selected map IDs: by default, ONLY pre-select maps that have edited dialogue!
  useEffect(() => {
    const validReadyIds = readyMaps.map((m) => m.id);
    setSelectedMapIds(validReadyIds);
    setGeneratedPdfUrl(null);
  }, [selectedSupervisorId, selectedDate, farmMaps]);

  if (!isOpen) return null;

  const toggleSelectMap = (id: string) => {
    // Only allow selecting if the dialogue is edited
    const targetMap = farmMaps.find((m) => m.id === id);
    if (!targetMap || !isFarmInspectionEdited(targetMap)) {
      alert('Esta finca está omitida porque su cuadro de diálogo no ha sido editado. Escribe una anotación para poder adjuntarla.');
      return;
    }

    if (selectedMapIds.includes(id)) {
      setSelectedMapIds(selectedMapIds.filter((mid) => mid !== id));
    } else {
      setSelectedMapIds([...selectedMapIds, id]);
    }
  };

  const selectAllReady = () => {
    setSelectedMapIds(readyMaps.map((m) => m.id));
  };

  const deselectAll = () => {
    setSelectedMapIds([]);
  };

  // STRICT REQUIREMENT: Only include maps that have their dialogue edited!
  const mapsToInclude = farmMaps.filter(
    (m) => selectedMapIds.includes(m.id) && isFarmInspectionEdited(m)
  );

  const handleSaveInlineNote = async (map: FarmMapRecord) => {
    const text = (draftNotes[map.id] ?? map.nightInspection?.observations ?? '').trim();
    if (!text) {
      alert('Por favor escribe las observaciones de inspección antes de adjuntar al reporte.');
      return;
    }

    setSavingNotesMapId(map.id);
    try {
      if (onUpdateNotes) {
        await onUpdateNotes(map.id, text);
      }
      // Auto select it for the PDF report
      setSelectedMapIds((prev) => Array.from(new Set([...prev, map.id])));
      setJustSavedMapId(map.id);
      setTimeout(() => setJustSavedMapId(null), 3000);
    } finally {
      setSavingNotesMapId(null);
    }
  };

  const handleGeneratePdf = async () => {
    if (!currentSupervisor || mapsToInclude.length === 0) {
      alert('No se puede generar el PDF consolidado: no hay ninguna finca seleccionada con cuadro de diálogo editado.');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateConsolidatedPdf({
        supervisor: currentSupervisor,
        date: selectedDate,
        maps: mapsToInclude,
        notes: reportNotes.trim() || undefined,
      });

      setGeneratedPdfUrl(result.url);
      setGeneratedFilename(result.filename);

      // Auto download for instant 1-click outcome without bureaucracy
      const a = document.createElement('a');
      a.href = result.url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error generating consolidated PDF:', err);
      alert('Error al generar el PDF consolidado. Por favor intenta de nuevo.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedPdfUrl) return;
    const a = document.createElement('a');
    a.href = generatedPdfUrl;
    a.download = generatedFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = async () => {
    const title = `Reporte Consolidado de Iluminación DOLE - ${currentSupervisor.name}`;
    const text = `Reporte de iluminación consolidado para ${currentSupervisor.name} (${currentSupervisor.category}) con fecha ${selectedDate}. Total fincas auditadas: ${mapsToInclude.length}.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url: generatedPdfUrl || window.location.href,
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
      } catch (err) {
        console.warn('Share dismissed:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="consolidated-modal-title"
        className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center text-red-600 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 id="consolidated-modal-title" className="font-extrabold text-base text-slate-900 leading-tight">
                Consolidar Documento PDF Único
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Une en un solo PDF las fincas aprobadas con anotaciones de inspección completadas.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar modal de reporte consolidado"
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Validación Visual de Calidad */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-bold text-slate-800">
              Validación: Solo se adjuntan al PDF fincas con anotación editada ({readyMaps.length} de {activeScopeMaps.length}).
            </span>
          </div>

          {omittedMaps.length > 0 && (
            <div className="flex items-center gap-1.5 text-rose-800 font-bold bg-rose-100/90 px-2.5 py-1 rounded-md border border-rose-200 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>{omittedMaps.length} {omittedMaps.length === 1 ? 'finca omitida' : 'fincas omitidas'} sin editar</span>
            </div>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Controles: Supervisor y Fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                Supervisor a Reportar *
              </label>
              <select
                value={selectedSupervisorId}
                onChange={(e) => {
                  setSelectedSupervisorId(e.target.value);
                  setGeneratedPdfUrl(null);
                }}
                className="w-full px-3 py-2 rounded-md border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-blue-600 outline-none"
              >
                {supervisors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {s.category} ({s.employeeCode})
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {currentSupervisor?.category} • {supervisorMaps.length} fincas registradas
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                Fecha de Inspección Consolidada *
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setGeneratedPdfUrl(null);
                }}
                className="w-full px-3 py-2 rounded-md border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-blue-600 outline-none"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                {dateMaps.length > 0 ? `${dateMaps.length} fincas con esta fecha` : 'Mostrando todas las fincas del supervisor'}
              </span>
            </div>
          </div>

          {/* Pestañas de Navegación de Validación: Listas vs Omitidas */}
          <div className="border-b border-slate-200 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('READY')}
              className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'READY'
                  ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Fincas Listas para el Reporte ({readyMaps.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('OMITTED')}
              className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'OMITTED'
                  ? 'border-rose-500 text-rose-800 bg-rose-50/60'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Fincas Omitidas Sin Editar ({omittedMaps.length})</span>
              {omittedMaps.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-200 text-rose-900 text-[10px] font-black">
                  {omittedMaps.length}
                </span>
              )}
            </button>
          </div>

          {/* TAB 1: FINCAS LISTAS (CON DIÁLOGO EDITADO) */}
          {activeTab === 'READY' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Fincas Aprobadas con Anotación ({mapsToInclude.length} seleccionadas de {readyMaps.length}):
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAllReady}
                    className="text-[11px] font-bold text-blue-700 hover:underline"
                  >
                    Seleccionar Todas
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={deselectAll}
                    className="text-[11px] font-bold text-slate-500 hover:underline"
                  >
                    Deseleccionar
                  </button>
                </div>
              </div>

              {readyMaps.length === 0 ? (
                <div className="p-6 text-center bg-rose-50 rounded-xl border border-rose-200 space-y-2">
                  <AlertTriangle className="w-6 h-6 text-rose-600 mx-auto" />
                  <h4 className="font-bold text-xs text-rose-900">
                    No hay fincas listas con el cuadro de diálogo editado
                  </h4>
                  <p className="text-xs text-rose-700 max-w-md mx-auto">
                    Todas las fincas están omitidas del consolidado. Ve a la pestaña <strong>"Fincas Omitidas Sin Editar"</strong> para escribir la observación técnica y adjuntarlas.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('OMITTED')}
                    className="mt-2 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <FileEdit className="w-3.5 h-3.5" />
                    <span>Ver y Editar Fincas Omitidas</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-1">
                  {readyMaps.map((mapItem) => {
                    const isChecked = selectedMapIds.includes(mapItem.id);
                    const isSameDate = mapItem.inspectionDate === selectedDate;

                    return (
                      <div
                        key={mapItem.id}
                        onClick={() => toggleSelectMap(mapItem.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                          isChecked
                            ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-400/30'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            className="text-emerald-700"
                            aria-label="Seleccionar finca"
                          >
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-emerald-700" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-xs text-slate-900 truncate">
                                {mapItem.farmName}
                              </span>
                              {isSameDate && (
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                                  Fecha coincidente
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 block truncate">
                              {mapItem.cropCategory} • {mapItem.inspectionDate}
                            </span>
                            <span className="text-[10px] text-emerald-700 font-bold block truncate mt-0.5">
                              ✓ Nota: "{mapItem.nightInspection?.observations?.slice(0, 35)}..."
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0 text-[11px]">
                          <span className="font-bold text-emerald-700">
                            {mapItem.nightInspection.coveragePercentage}%
                          </span>
                          <span className="text-slate-400 block text-[10px]">
                            {mapItem.nightInspection.totalActiveLights} operativas
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FINCAS OMITIDAS (LISTA PARA EDITAR Y REENVIAR) */}
          {activeTab === 'OMITTED' && (
            <div className="space-y-3">
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Fincas omitidas del consolidado:</strong> Estas fincas no se adjuntarán al PDF porque su cuadro de diálogo de inspección no ha sido editado. Escribe la observación y presiona <strong>"Guardar y Adjuntar"</strong> para reenviarlas al reporte.
                </div>
              </div>

              {omittedMaps.length === 0 ? (
                <div className="p-6 text-center bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600 mx-auto" />
                  <h4 className="font-bold text-xs text-emerald-900">
                    ¡Ninguna finca omitida!
                  </h4>
                  <p className="text-xs text-emerald-700">
                    Todas las fincas tienen sus observaciones editadas y están listas para el reporte.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto p-1 pr-2">
                  {omittedMaps.map((map) => {
                    const currentText = draftNotes[map.id] ?? (map.nightInspection?.observations || '');
                    const isSaving = savingNotesMapId === map.id;
                    const wasSaved = justSavedMapId === map.id;

                    return (
                      <div
                        key={map.id}
                        className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/30 space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-14 h-11 rounded-lg border border-slate-200 overflow-hidden shrink-0 bg-slate-100">
                              <img
                                src={map.imageDataUrl}
                                alt={map.farmName}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-extrabold text-xs text-slate-900 truncate">
                                {map.farmName}
                              </h4>
                              <span className="text-[11px] text-slate-500 block truncate">
                                {map.cropCategory} • {map.inspectionDate}
                              </span>
                            </div>
                          </div>

                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200 shrink-0">
                            Omitida del PDF
                          </span>
                        </div>

                        {/* Editor de anotación en línea */}
                        <div className="space-y-1">
                          <textarea
                            rows={2}
                            value={currentText}
                            onChange={(e) => setDraftNotes({ ...draftNotes, [map.id]: e.target.value })}
                            placeholder="Escribe aquí las observaciones de la finca para adjuntarla al reporte..."
                            className="w-full text-base font-bold text-slate-900 bg-white border border-slate-300 rounded-lg p-2.5 placeholder:text-slate-400 placeholder:font-normal placeholder:text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 resize-none leading-snug"
                          />
                          <div className="flex items-center justify-end pt-1">
                            <button
                              type="button"
                              onClick={() => handleSaveInlineNote(map)}
                              disabled={isSaving}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              {isSaving ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  <span>Guardando...</span>
                                </>
                              ) : wasSaved ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>¡Adjuntada al Reporte!</span>
                                </>
                              ) : (
                                <>
                                  <Send className="w-3 h-3" />
                                  <span>Guardar y Adjuntar al Reporte</span>
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
          )}

          {/* Directrices para la Revisión Gerencial */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Directrices u Observaciones para la Revisión Gerencial (Opcional):
            </label>
            <textarea
              rows={2}
              value={reportNotes}
              onChange={(e) => setReportNotes(e.target.value)}
              placeholder="Ej: Se solicita aprobación para compra de 15 bombillas LED de 150W para sustitución prioritaria en empacadoras..."
              className="w-full p-2.5 rounded-lg border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-[#003865]/20 placeholder:text-slate-400"
            />
          </div>

          {/* Live PDF Preview if Generated */}
          {generatedPdfUrl && (
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-extrabold text-emerald-900">
                    PDF Generado con Éxito: {generatedFilename} ({mapsToInclude.length} fincas adjuntas)
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
                  {mapsToInclude.length + 1} páginas en formato A4
                </span>
              </div>

              {/* Embedded PDF iframe */}
              <div className="w-full h-80 rounded-xl border border-slate-300 overflow-hidden bg-slate-100 shadow-inner">
                <iframe
                  src={`${generatedPdfUrl}#toolbar=0`}
                  title="Vista Previa PDF Consolidado"
                  className="w-full h-full border-none"
                />
              </div>

              {/* Action Buttons for Download and Share */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Descargar Archivo PDF
                  </button>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="px-4 py-2 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Share2 className="w-4 h-4 text-slate-600" />
                    {shareSuccess ? '¡Enlace Listo!' : 'Compartir / Enviar'}
                  </button>
                </div>

                <a
                  href={generatedPdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Abrir en pestaña completa
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-600">
            <span className="font-bold text-slate-900">{mapsToInclude.length} fincas</span> seleccionadas para adjuntar al documento.
            {omittedMaps.length > 0 && (
              <span className="text-rose-700 font-semibold ml-1">
                ({omittedMaps.length} omitidas sin editar)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cerrar
            </button>

            <button
              type="button"
              disabled={isGenerating || mapsToInclude.length === 0}
              onClick={handleGeneratePdf}
              className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              title={mapsToInclude.length === 0 ? 'Debes tener al menos 1 finca con anotación editada para generar el PDF' : 'Generar PDF Consolidado'}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Generando Documento Consolidado...</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 text-white" />
                  <span>
                    {generatedPdfUrl 
                      ? `Volver a Descargar PDF (${mapsToInclude.length} fincas)` 
                      : `Generar PDF Consolidado (${mapsToInclude.length} fincas)`}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
