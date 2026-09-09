import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import { Supervisor, FarmMapRecord, CropCategory } from '../types';
import { extractFarmNameFromFileName, deriveCleanFileName } from '../utils/farmName';
import { optimizeImageDataUrl } from '../utils/imageUtils';
import { resolveFilesAndZips } from '../utils/zipExtractor';
import { 
  X, 
  UploadCloud, 
  Check, 
  AlertCircle, 
  FileText, 
  ArrowRight,
  FolderArchive,
  Loader2
} from 'lucide-react';
import { ThemeConfig } from '../utils/theme';

interface BatchItem {
  id: string;
  originalFileName: string;
  dataUrl: string;
  farmName: string;
  renamedFileName: string;
  status: 'done';
  cropCategory: CropCategory;
}

interface BatchUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  supervisors: Supervisor[];
  initialSupervisor?: Supervisor | null;
  theme: ThemeConfig;
  preloadedFiles?: File[];
  onSaveBatch: (records: FarmMapRecord[]) => void;
}

export function BatchUploadModal({
  isOpen,
  onClose,
  supervisors,
  initialSupervisor,
  theme,
  preloadedFiles,
  onSaveBatch,
}: BatchUploadModalProps) {
  const [selectedSupervisorId, setSelectedSupervisorId] = useState(
    initialSupervisor?.id || supervisors[0]?.id || ''
  );
  const [inspectionDate, setInspectionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [items, setItems] = useState<BatchItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentSupervisor = supervisors.find((s) => s.id === selectedSupervisorId) || supervisors[0];

  // Process files when preloadedFiles changes
  useEffect(() => {
    if (initialSupervisor) {
      setSelectedSupervisorId(initialSupervisor.id);
    }
  }, [initialSupervisor, isOpen]);

  useEffect(() => {
    if (preloadedFiles && preloadedFiles.length > 0) {
      loadFiles(preloadedFiles);
    }
  }, [preloadedFiles]);

  if (!isOpen) return null;

  const loadFiles = async (files: FileList | File[]) => {
    setError(null);
    const rawList = Array.from(files);
    if (rawList.length === 0) return;

    setIsProcessing(true);

    try {
      // Extrae imágenes de archivos comprimidos .zip (incluso si están dentro de subcarpetas como pdf/)
      const { imageFiles, extractedCount, zipCount } = await resolveFilesAndZips(rawList);

      if (imageFiles.length === 0) {
        if (zipCount > 0) {
          setError('No se encontraron imágenes compatibles (.png, .jpg, .webp) dentro del archivo comprimido.');
        } else {
          setError('No se encontraron archivos de imagen válidos.');
        }
        setIsProcessing(false);
        return;
      }

      // Read all files as base64 and extract farm name directly from file name
      const newItems: BatchItem[] = [];
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const rawDataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        const dataUrl = await optimizeImageDataUrl(rawDataUrl);

        const farmName = extractFarmNameFromFileName(file.name);
        const isPineapple = 
          file.name.toLowerCase().includes('piña') || 
          file.name.toLowerCase().includes('pina') || 
          currentSupervisor?.category.includes('Piña');

        newItems.push({
          id: `batch-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
          originalFileName: file.name,
          dataUrl,
          farmName,
          renamedFileName: deriveCleanFileName(farmName, file.name),
          status: 'done',
          cropCategory: isPineapple ? 'Fincas de Piñas y banano' : (currentSupervisor?.category || 'Fincas de Banano'),
        });
      }

      setItems((prev) => [...prev, ...newItems]);
    } catch (err: any) {
      console.error('Error al procesar archivos/comprimidos:', err);
      setError('Ocurrió un error al procesar las imágenes o descomprimir la carpeta.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      loadFiles(e.target.files);
    }
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((it) => it.id !== id));
  };

  const handleUpdateItemName = (id: string, newName: string) => {
    setItems(
      items.map((it) => {
        if (it.id === id) {
          return {
            ...it,
            farmName: newName,
            renamedFileName: deriveCleanFileName(newName, it.originalFileName),
          };
        }
        return it;
      })
    );
  };

  const handleSaveAll = () => {
    if (items.length === 0) {
      setError('Por favor selecciona al menos una imagen de mapa.');
      return;
    }

    const sup = supervisors.find((s) => s.id === selectedSupervisorId) || supervisors[0];

    const records: FarmMapRecord[] = items.map((item, idx) => ({
      id: `map-${Date.now()}-${idx}`,
      supervisorId: sup.id,
      supervisorName: sup.name,
      farmName: item.farmName.trim(),
      extractedRawText: `Nombre de archivo: ${item.originalFileName}`,
      cropCategory: item.cropCategory,
      inspectionDate,
      imageDataUrl: item.dataUrl,
      imageFileName: item.renamedFileName,
      zones: [],
      dayInspection: {
        totalInspectedPoles: 30,
        physicalCondition: 'Bueno',
        photocellsStatus: 'Operativas',
        daytimeLightsOnAnomaly: 0,
        wiringCondition: 'Óptimo',
        observations: `Inspección de ${item.farmName}.`,
      },
      nightInspection: {
        totalActiveLights: 28,
        totalDamagedLights: 2,
        coveragePercentage: 93.3,
        darkZonesDetected: [],
        urgencyLevel: 'Baja',
        observations: '',
      },
      createdAt: Date.now() + idx,
      updatedAt: Date.now() + idx,
    }));

    onSaveBatch(records);
    // Limpia la bandeja de subida para permitir subir nuevos mapas
    setItems([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  const handleClearTray = () => {
    setItems([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setError(null);
  };

  const completedCount = items.filter((it) => it.status === 'done').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="batch-modal-title"
        className="bg-white rounded-xl max-w-3xl w-full shadow-xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white">
          <div>
            <h3 id="batch-modal-title" className="font-bold text-base text-slate-900 leading-tight">
              Cargar Grupo de Mapas
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              El nombre de la finca se toma directamente del archivo de cada foto subida.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Configuración rápida: Supervisor y Fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Supervisor Asignado
              </label>
              <select
                value={selectedSupervisorId}
                onChange={(e) => setSelectedSupervisorId(e.target.value)}
                className="w-full px-3 py-1.5 rounded border border-slate-200 bg-white text-xs font-semibold text-slate-900 outline-none"
              >
                {supervisors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.category.includes('Piña') ? 'Piñas y Banano' : 'Banano'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Fecha de Inspección
              </label>
              <input
                type="date"
                value={inspectionDate}
                onChange={(e) => setInspectionDate(e.target.value)}
                className="w-full px-3 py-1.5 rounded border border-slate-200 bg-white text-xs text-slate-900 outline-none"
              />
            </div>
          </div>

          {/* Dropzone para selección por grupo o carpeta comprimida .ZIP */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-5 text-center cursor-pointer transition-colors hover:bg-slate-50 relative group"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.zip,application/zip,application/x-zip-compressed"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex items-center justify-center gap-2 mb-2">
              <UploadCloud className="w-7 h-7 text-slate-400 group-hover:text-blue-500 transition-colors" />
              <FolderArchive className="w-6 h-6 text-amber-500" />
            </div>
            <p className="text-xs font-bold text-slate-800">
              Haz clic o arrastra fotos individuales, grupo de imágenes o carpeta comprimida (.ZIP)
            </p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-lg mx-auto">
              Soporta archivos <span className="font-semibold text-slate-700">.ZIP</span> con carpetas de imágenes (ej. carpeta PDF de planos/mapas). La aplicación extraerá automáticamente todas las imágenes (.png, .jpg, .webp) y detectará el nombre de cada finca.
            </p>
            {isProcessing && (
              <div className="mt-3 flex items-center justify-center gap-2 text-xs font-bold text-blue-600 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Extrayendo y procesando imágenes...</span>
              </div>
            )}
          </div>

          {/* Lista de archivos del grupo con su nuevo nombre asignado */}
          {items.length > 0 && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-700">
                <div className="flex items-center gap-2">
                  <span className="uppercase tracking-wider">Imágenes en el Grupo ({items.length})</span>
                  <span className="text-[11px] text-slate-500 font-normal hidden sm:inline">
                    • Nombre tomado del archivo de cada foto
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleClearTray}
                  className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1"
                  title="Vaciar esta lista para subir fotos nuevas (no afecta los mapas ya guardados)"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Vaciar lista de subida</span>
                </button>
              </div>

              <p className="text-[10.5px] text-slate-500 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                ℹ️ <strong>Nota:</strong> Vaciar o quitar elementos de esta bandeja solo limpia la cola de subida para cargar nuevos mapas; <u>los mapas ya guardados en la aplicación NO se eliminarán</u>.
              </p>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg border border-slate-200 bg-white shadow-2xs flex items-center gap-3"
                  >
                    <div className="w-16 h-12 rounded border border-slate-200 overflow-hidden shrink-0 bg-slate-100">
                      <img
                        src={item.dataUrl}
                        alt={item.farmName}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400 font-mono truncate max-w-[150px]">
                          {item.originalFileName}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
                        <span className="text-xs font-bold text-blue-700 font-mono truncate flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          <FileText className="w-3 h-3 text-blue-600" />
                          {item.renamedFileName}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Nombre Finca:</span>
                        <input
                          type="text"
                          value={item.farmName}
                          onChange={(e) => handleUpdateItemName(item.id, e.target.value)}
                          placeholder="Nombre de Finca"
                          className="text-xs font-bold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-blue-600 focus:outline-none bg-transparent px-0.5 py-0.5"
                        />
                      </div>
                    </div>

                    <div className="p-1 rounded-full bg-emerald-100 text-emerald-700 shrink-0" title="Nombre asignado del archivo">
                      <Check className="w-3.5 h-3.5" />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-white transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={items.length === 0 || isProcessing}
            onClick={handleSaveAll}
            className={`px-5 py-2 rounded-md text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50 ${theme.buttonBg}`}
          >
            <Check className="w-4 h-4 text-white" />
            <span>Guardar Grupo ({items.length} Fincas)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
