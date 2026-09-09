import { useState, useEffect, useRef, type ChangeEvent, type FormEvent, type DragEvent } from 'react';
import { 
  Supervisor, 
  CropCategory, 
  FarmMapRecord 
} from '../types';
import { createFarmMapSvg } from '../services/mapTemplates';
import { extractFarmNameFromFileName, deriveCleanFileName } from '../utils/farmName';
import { optimizeImageDataUrl } from '../utils/imageUtils';
import { resolveFilesAndZips } from '../utils/zipExtractor';
import { 
  X, 
  UploadCloud, 
  Check, 
  AlertCircle, 
  FileText, 
  Layers, 
  ArrowRight,
  ImageIcon,
  FolderArchive,
  Loader2
} from 'lucide-react';
import { ThemeConfig } from '../utils/theme';

export interface MapUploadItem {
  id: string;
  originalFileName: string;
  dataUrl: string;
  farmName: string;
  renamedFileName: string;
  status: 'done';
  cropCategory: CropCategory;
}

interface AddMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  supervisors: Supervisor[];
  initialSupervisor?: Supervisor | null;
  theme: ThemeConfig;
  onSave: (mapRecord: FarmMapRecord) => void;
  onSaveBatch?: (mapRecords: FarmMapRecord[]) => void;
}

export function AddMapModal({
  isOpen,
  onClose,
  supervisors,
  initialSupervisor,
  theme,
  onSave,
  onSaveBatch,
}: AddMapModalProps) {
  const [selectedSupervisorId, setSelectedSupervisorId] = useState(
    initialSupervisor?.id || supervisors[0]?.id || ''
  );

  const currentSupervisor = supervisors.find((s) => s.id === selectedSupervisorId) || supervisors[0];
  const [cropCategory, setCropCategory] = useState<CropCategory>(
    currentSupervisor?.category || 'Fincas de Banano'
  );

  const [inspectionDate, setInspectionDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Group of uploaded map items
  const [items, setItems] = useState<MapUploadItem[]>([]);
  const [isReadingFiles, setIsReadingFiles] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialSupervisor) {
      setSelectedSupervisorId(initialSupervisor.id);
      setCropCategory(initialSupervisor.category);
    }
  }, [initialSupervisor, isOpen]);

  if (!isOpen) return null;

  // Handle supervisor change
  const handleSupervisorChange = (supId: string) => {
    setSelectedSupervisorId(supId);
    const sup = supervisors.find((s) => s.id === supId);
    if (sup) {
      setCropCategory(sup.category);
    }
  };

  // Process files (single, multiple in group, or .zip archive) using the file name directly
  const handleFilesSelected = async (files: FileList | File[]) => {
    setError(null);
    const rawList = Array.from(files);
    if (rawList.length === 0) return;

    setIsReadingFiles(true);

    try {
      // Extrae imágenes de archivos comprimidos .zip (incluso si están dentro de subcarpetas como pdf/)
      const { imageFiles, extractedCount, zipCount } = await resolveFilesAndZips(rawList);

      if (imageFiles.length === 0) {
        if (zipCount > 0) {
          setError('No se encontraron imágenes compatibles (.png, .jpg, .webp) dentro del archivo comprimido.');
        } else {
          setError('No se encontraron archivos de imagen válidos.');
        }
        setIsReadingFiles(false);
        return;
      }

      const newIncomingItems: MapUploadItem[] = [];
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const rawDataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        const dataUrl = await optimizeImageDataUrl(rawDataUrl);

        // Directly extract the farm name from the uploaded image's file name
        const farmName = extractFarmNameFromFileName(file.name);
        const isPineapple = 
          file.name.toLowerCase().includes('piña') || 
          file.name.toLowerCase().includes('pina') || 
          currentSupervisor?.category.includes('Piña');

        newIncomingItems.push({
          id: `map-item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${i}`,
          originalFileName: file.name,
          dataUrl,
          farmName,
          renamedFileName: deriveCleanFileName(farmName, file.name),
          status: 'done',
          cropCategory: isPineapple ? 'Fincas de Piñas y banano' : (currentSupervisor?.category || 'Fincas de Banano'),
        });
      }

      setItems((prev) => [...prev, ...newIncomingItems]);
    } catch (err: any) {
      console.error('Error procesando archivos o comprimidos:', err);
      setError('Ocurrió un error al procesar las imágenes o descomprimir la carpeta.');
    } finally {
      setIsReadingFiles(false);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFilesSelected(e.target.files);
      // Reset input value to allow re-selecting the same file if needed
      e.target.value = '';
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleUpdateItemName = (id: string, newName: string) => {
    setItems((prev) =>
      prev.map((it) => {
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

  // Quick 1-click template loader (can add single or multiple)
  const loadSampleTemplate = (name: string, type: 'Banano' | 'Piña y Banano') => {
    const dataUrl = createFarmMapSvg(name, type, 32, 2);
    const orig = `${name.toLowerCase().replace(/\s+/g, '_')}.png`;
    const newItem: MapUploadItem = {
      id: `sample-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      originalFileName: orig,
      dataUrl,
      farmName: name,
      renamedFileName: orig,
      status: 'done',
      cropCategory: type === 'Banano' ? 'Fincas de Banano' : 'Fincas de Piñas y banano',
    };
    setItems((prev) => [...prev, newItem]);
  };

  const loadSampleGroup = () => {
    const isPineapple = currentSupervisor?.category.includes('Piña');
    const farms = [
      { name: 'Finca Santa Inés', type: isPineapple ? 'Piña y Banano' as const : 'Banano' as const },
      { name: 'Finca Monterrey', type: isPineapple ? 'Piña y Banano' as const : 'Banano' as const },
      { name: 'Finca El Carmen', type: isPineapple ? 'Piña y Banano' as const : 'Banano' as const },
    ];

    const sampleItems: MapUploadItem[] = farms.map((f, idx) => ({
      id: `sample-group-${Date.now()}-${idx}`,
      originalFileName: `${f.name.toLowerCase().replace(/\s+/g, '_')}.png`,
      dataUrl: createFarmMapSvg(f.name, f.type, 30, 2),
      farmName: f.name,
      renamedFileName: `${f.name.replace(/\s+/g, '_')}.png`,
      status: 'done',
      cropCategory: f.type === 'Banano' ? 'Fincas de Banano' : 'Fincas de Piñas y banano',
    }));

    setItems((prev) => [...prev, ...sampleItems]);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      setError('Por favor selecciona o arrastra al menos una imagen de mapa.');
      return;
    }

    const sup = supervisors.find((s) => s.id === selectedSupervisorId) || supervisors[0];

    const records: FarmMapRecord[] = items.map((item, idx) => ({
      id: `map-${Date.now()}-${idx}`,
      supervisorId: sup.id,
      supervisorName: sup.name,
      farmName: item.farmName.trim() || 'Finca Sin Título',
      extractedRawText: `Nombre de archivo: ${item.originalFileName}`,
      cropCategory: item.cropCategory || cropCategory,
      inspectionDate,
      imageDataUrl: item.dataUrl,
      imageFileName: item.renamedFileName || `${item.farmName.replace(/\s+/g, '_')}.png`,
      zones: [],
      dayInspection: {
        totalInspectedPoles: 30,
        physicalCondition: 'Bueno',
        photocellsStatus: 'Operativas',
        daytimeLightsOnAnomaly: 0,
        wiringCondition: 'Óptimo',
        observations: `Inspección de ${item.farmName.trim()}.`,
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

    if (records.length > 1 && onSaveBatch) {
      onSaveBatch(records);
    } else if (records.length === 1) {
      if (onSaveBatch) {
        onSaveBatch(records);
      } else {
        onSave(records[0]);
      }
    } else if (onSaveBatch) {
      onSaveBatch(records);
    } else {
      records.forEach((r) => onSave(r));
    }

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-map-title"
        className="bg-white rounded-xl max-w-2xl w-full shadow-xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[90vh]"
      >
        {/* Header simple y directo */}
        <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <h3 id="add-map-title" className="font-bold text-base text-slate-900 leading-tight flex items-center gap-2">
              <span>Subir Mapas de Finca</span>
              {items.length > 1 && (
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${theme.badgeBg}`}>
                  Grupo de {items.length} fotos
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Sube fotos individuales o en grupo. El nombre de la finca se toma directamente del nombre de cada archivo.
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
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
                Supervisor Asignado *
              </label>
              <select
                value={selectedSupervisorId}
                onChange={(e) => handleSupervisorChange(e.target.value)}
                className="w-full px-3 py-1.5 rounded border border-slate-200 focus:border-blue-600 text-xs font-semibold text-slate-900 outline-none bg-white"
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

          {/* SECCIÓN PRINCIPAL: MAPA DE LA FINCA (IMAGEN) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                MAPA DE LA FINCA (IMAGEN)
              </label>
              {items.length > 0 && (
                <span className="text-xs text-slate-500 font-semibold">
                  {items.length} {items.length === 1 ? 'imagen cargada' : 'imágenes en grupo'}
                </span>
              )}
            </div>

            {/* Dropzone interactivo con soporte de múltiples imágenes (GRUPO) */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/60 scale-[0.99]'
                  : items.length > 0
                  ? 'border-blue-300 bg-blue-50/10 hover:bg-blue-50/30'
                  : 'border-slate-300 hover:border-blue-500 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.zip,application/zip,application/x-zip-compressed"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <div className="py-1 space-y-1.5">
                <div className="flex items-center justify-center gap-2">
                  <div className="relative inline-block">
                    <UploadCloud className="w-7 h-7 text-slate-400 mx-auto" />
                    <Layers className="w-3.5 h-3.5 text-blue-600 absolute -bottom-1 -right-1 bg-white rounded-full" />
                  </div>
                  <FolderArchive className="w-6 h-6 text-amber-500" />
                </div>
                <p className="text-xs font-bold text-slate-800">
                  {items.length > 0 
                    ? 'Haz clic o arrastra más fotos o carpetas comprimidas (.ZIP)' 
                    : 'Haz clic o arrastra fotos individuales o carpetas comprimidas (.ZIP) aquí'}
                </p>
                <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                  Soporta imágenes individuales, grupos o archivos <strong>.ZIP con carpetas de planos/imágenes (ej. carpeta PDF)</strong>. La app descomprime y extrae todas las imágenes automáticamente.
                </p>
                {isReadingFiles && (
                  <div className="mt-2 flex items-center justify-center gap-1.5 text-xs font-bold text-blue-600 animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Descomprimiendo y procesando imágenes...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Accesos rápidos de prueba */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-slate-400">Prueba rápida:</span>
                <button
                  type="button"
                  onClick={() => loadSampleTemplate('Finca San Pablo', 'Banano')}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold"
                >
                  + Finca San Pablo
                </button>
                <button
                  type="button"
                  onClick={() => loadSampleTemplate('Finca La Esperanza', 'Piña y Banano')}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold"
                >
                  + Finca La Esperanza
                </button>
              </div>

              <button
                type="button"
                onClick={loadSampleGroup}
                className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold border border-blue-200 flex items-center gap-1"
                title="Cargar lote de 3 fincas de demostración"
              >
                <Layers className="w-3 h-3" />
                <span>+ Cargar Grupo de Prueba (3 Fotos)</span>
              </button>
            </div>
          </div>

          {/* LISTA DE IMÁGENES DEL GRUPO CARGADAS */}
          {items.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-700">
                <div className="flex items-center gap-2">
                  <span className="uppercase tracking-wider">Fotos en Bandeja ({items.length})</span>
                  <span className="text-[11px] text-slate-400 font-normal hidden sm:inline">
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

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg border border-slate-200 bg-white shadow-2xs flex items-center gap-3 transition-colors hover:border-slate-300"
                  >
                    {/* Thumbnail */}
                    <div className="w-16 h-12 rounded border border-slate-200 overflow-hidden shrink-0 bg-slate-100 shadow-2xs">
                      <img
                        src={item.dataUrl}
                        alt={item.farmName}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Metadata & Renamed File */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400 font-mono truncate max-w-[140px]" title={item.originalFileName}>
                          {item.originalFileName}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
                        <span className="text-xs font-bold text-blue-700 font-mono truncate flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          <FileText className="w-3 h-3 text-blue-600 shrink-0" />
                          <span className="truncate">{item.renamedFileName}</span>
                        </span>
                      </div>

                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 uppercase font-bold shrink-0">
                          Nombre Finca:
                        </span>
                        <input
                          type="text"
                          value={item.farmName}
                          onChange={(e) => handleUpdateItemName(item.id, e.target.value)}
                          placeholder="Nombre de Finca"
                          className="w-full text-xs font-bold text-slate-900 border-b border-slate-200 hover:border-slate-400 focus:border-blue-600 focus:outline-none bg-transparent px-1 py-0.5"
                        />
                      </div>
                    </div>

                    {/* Status */}
                    <div className="p-1 rounded-full bg-emerald-100 text-emerald-700 shrink-0" title="Nombre asignado directamente del archivo">
                      <Check className="w-3.5 h-3.5" />
                    </div>

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded transition-colors shrink-0"
                      title="Quitar foto del grupo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={items.length === 0 || isReadingFiles}
              className={`px-5 py-2 rounded-md text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 ${theme.buttonBg}`}
            >
              <Check className="w-4 h-4 text-white" />
              <span>
                {items.length > 1
                  ? `Guardar Grupo (${items.length} Fincas)`
                  : items.length === 1
                  ? 'Guardar Finca'
                  : 'Guardar Mapas'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
