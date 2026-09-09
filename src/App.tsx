import { useState, useEffect, useRef, useCallback, type ChangeEvent } from 'react';
import { Supervisor, FarmMapRecord, CropCategory, AppUser } from './types';
import { 
  getSupervisors, 
  saveSupervisor, 
  getFarmMaps, 
  saveFarmMap, 
  saveFarmMapsBulk,
  deleteFarmMap,
  updateFarmMapObservations,
  isUserAuthenticated,
  setAuthenticatedSession,
  getSessionUser,
  clearInspectionNotesForSession,
  addConnectionLog
} from './services/storage';
import { generateConsolidatedPdf } from './services/pdfGenerator';
import { Navbar } from './components/Navbar';
import { SupervisorModule } from './components/SupervisorModule';
import { FarmMapCard } from './components/FarmMapCard';
import { AddMapModal } from './components/AddMapModal';
import { BatchUploadModal } from './components/BatchUploadModal';
import { AddSupervisorModal } from './components/AddSupervisorModal';
import { ConsolidatedPdfModal } from './components/ConsolidatedPdfModal';
import { HelpModal } from './components/HelpModal';
import { ConnectionLogsModal } from './components/ConnectionLogsModal';
import { PendingFarmsModal } from './components/PendingFarmsModal';
import { LoginModule } from './components/LoginModule';
import { partitionFarmMaps, isFarmInspectionEdited } from './utils/farmValidation';
import { getSupervisorTheme } from './utils/theme';
import { resolveFilesAndZips } from './utils/zipExtractor';
import { 
  UploadCloud, 
  Search, 
  Loader2, 
  MapPin, 
  CheckCircle2,
  Layers,
  FileDown,
  Sparkles,
  Share2,
  FolderArchive,
  AlertTriangle,
  FileEdit,
  Database
} from 'lucide-react';

export default function App() {
  // Estado de Autenticación por contraseña (15926) y usuario activo
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => isUserAuthenticated());
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => getSessionUser());

  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [farmMaps, setFarmMaps] = useState<FarmMapRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Active filters and views
  const [activeTab, setActiveTab] = useState<'all' | 'supervisors' | 'maps'>('all');
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | CropCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [notesFilter, setNotesFilter] = useState<'ALL' | 'READY' | 'OMITTED'>('ALL');

  // Modals state
  const [isAddMapOpen, setIsAddMapOpen] = useState(false);
  const [isBatchUploadOpen, setIsBatchUploadOpen] = useState(false);
  const [batchPreloadedFiles, setBatchPreloadedFiles] = useState<File[]>([]);
  const [isAddSupervisorOpen, setIsAddSupervisorOpen] = useState(false);
  const [isConsolidatedPdfOpen, setIsConsolidatedPdfOpen] = useState(false);
  const [isPendingFarmsModalOpen, setIsPendingFarmsModalOpen] = useState(false);
  const [modalInitialSupervisor, setModalInitialSupervisor] = useState<Supervisor | null>(null);

  // Modules: Help and Connection Logs
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);

  // Quick 1-click PDF download loading state
  const [isQuickDownloading, setIsQuickDownloading] = useState(false);
  const [quickNotification, setQuickNotification] = useState<string | null>(null);
  // Track maps whose PDF has been generated/sent during this session
  const [sentPdfMapIds, setSentPdfMapIds] = useState<Set<string>>(new Set());
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const groupDropInputRef = useRef<HTMLInputElement>(null);

  // Active supervisor and dynamic theme (Strict interface separation)
  const activeSupervisorId = selectedSupervisorId || (supervisors.length > 0 ? supervisors[0].id : null);
  const selectedSupervisor = supervisors.find((s) => s.id === activeSupervisorId) || (supervisors.length > 0 ? supervisors[0] : null);
  const currentTheme = getSupervisorTheme(selectedSupervisor?.category);

  // Load persistent data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [loadedSupervisors, loadedMaps] = await Promise.all([
          getSupervisors(),
          getFarmMaps(),
        ]);
        setSupervisors(loadedSupervisors);

        // Si ya está autenticado, limpiar anotaciones de inspección de sesiones previas
        if (isUserAuthenticated()) {
          const cleanMaps = await clearInspectionNotesForSession();
          setFarmMaps(cleanMaps);
        } else {
          setFarmMaps(loadedMaps);
        }

        if (loadedSupervisors.length > 0) {
          setSelectedSupervisorId((prev) => prev || loadedSupervisors[0].id);
        }
      } catch (err) {
        console.error('Error loading initial app data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const notify = (msg: string) => {
    setQuickNotification(msg);
    setTimeout(() => setQuickNotification(null), 3500);
  };

  const handleLoginSuccess = async (user: AppUser) => {
    setAuthenticatedSession(user);
    setCurrentUser(user);
    setIsAuthenticated(true);

    // DIRECTIVA: Al entrar a la aplicación, se borra lo que se escribió en las anotaciones
    // de inspección para que el usuario encuentre la aplicación siempre disponible
    // para incluir nuevos datos, mientras los mapas continúan guardados de forma permanente.
    try {
      const cleanMaps = await clearInspectionNotesForSession();
      setFarmMaps(cleanMaps);
    } catch (e) {
      console.error('Error al reiniciar anotaciones en inicio de sesión:', e);
    }

    // Vincular la interfaz del supervisor correspondiente según el usuario logueado
    if (user.role.toLowerCase().includes('banano') && !user.role.toLowerCase().includes('piña')) {
      const bananaSup = supervisors.find((s) => s.category === 'Fincas de Banano');
      if (bananaSup) setSelectedSupervisorId(bananaSup.id);
    } else {
      const pineSup = supervisors.find((s) => s.category.includes('Piña'));
      if (pineSup) setSelectedSupervisorId(pineSup.id);
    }

    await addConnectionLog(user);
    notify(`Acceso concedido. Bienvenido, ${user.name}.`);
  };

  const handleLogout = async () => {
    // DIRECTIVA: Al salir de la aplicación, se borra lo que se escribió en las anotaciones
    // de inspección, garantizando que los mapas se conserven guardados.
    try {
      const cleanMaps = await clearInspectionNotesForSession();
      setFarmMaps(cleanMaps);
    } catch (e) {
      console.error('Error al reiniciar anotaciones al salir:', e);
    }

    setAuthenticatedSession(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
    notify('Sesión cerrada. Los mapas quedan guardados permanentemente en el sistema.');
  };

  const handleSaveSupervisor = async (newSup: Supervisor) => {
    const updated = await saveSupervisor(newSup);
    setSupervisors(updated);
    notify(`Supervisor ${newSup.name} añadido con éxito.`);
  };

  const handleSaveFarmMap = async (newMap: FarmMapRecord) => {
    const updated = await saveFarmMap(newMap);
    setFarmMaps(updated);
    notify(`Finca "${newMap.farmName}" guardada y renombrada.`);
  };

  const handleUpdateFarmMapNotes = useCallback(async (id: string, notes: string) => {
    // 1. Actualizar inmediatamente en memoria para que el PDF unificado contenga las notas actualizadas
    setFarmMaps((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        return {
          ...m,
          nightInspection: {
            ...m.nightInspection,
            observations: notes,
          },
          dayInspection: {
            ...m.dayInspection,
            observations: notes,
          },
          updatedAt: Date.now(),
        };
      })
    );

    // 2. Persistir en almacenamiento en segundo plano sin interrumpir ni lanzar notificaciones invasivas
    try {
      await updateFarmMapObservations(id, notes);
    } catch (err) {
      console.error('Error guardando anotación de finca:', err);
    }
  }, []);

  const handleSaveBatchMaps = async (newRecords: FarmMapRecord[]) => {
    const updated = await saveFarmMapsBulk(newRecords);
    setFarmMaps(updated);
    notify(`Grupo de ${newRecords.length} fincas guardadas y renombradas.`);
  };

  const handleDeleteFarmMap = async (id: string) => {
    const updated = await deleteFarmMap(id);
    setFarmMaps(updated);
    notify('Mapa eliminado.');
  };

  // Función Principal: UNIR TODOS LOS PDF EN UN DOCUMENTO
  // En celular abre menú de envío (WhatsApp/Email/Compartir), en PC descarga directa
  const handleUnirTodosLosPdf = async (supervisorId?: string) => {
    const targetSupervisor = supervisorId 
      ? supervisors.find((s) => s.id === supervisorId) 
      : (selectedSupervisorId ? supervisors.find((s) => s.id === selectedSupervisorId) : supervisors[0]);

    if (!targetSupervisor) {
      notify('Por favor seleccione un supervisor primero.');
      return;
    }

    const targetMaps = farmMaps.filter((m) => m.supervisorId === targetSupervisor.id);
    if (targetMaps.length === 0) {
      notify(`No hay mapas registrados para ${targetSupervisor.name}. Sube fotos de fincas primero.`);
      return;
    }

    // DIRECTIVA ESTRICTA: El consolidado PDF solo debe incluir los archivos donde se haya editado el cuadro de diálogo.
    // Si no se modificó, no lo adjuntes.
    const { readyMaps, omittedMaps } = partitionFarmMaps(targetMaps);

    if (readyMaps.length === 0) {
      notify(`Se omitieron las ${omittedMaps.length} fincas porque no tienen editado el cuadro de diálogo. Por favor edítalas para incluirlas en el reporte.`);
      setIsPendingFarmsModalOpen(true);
      return;
    }

    setIsQuickDownloading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Generar PDF consolidado ÚNICAMENTE con los mapas que tienen el cuadro de diálogo editado
      const result = await generateConsolidatedPdf({
        supervisor: targetSupervisor,
        date: readyMaps[0]?.inspectionDate || today,
        maps: readyMaps,
        notes: `Reporte unificado de iluminación DOLE - ${targetSupervisor.name}. (${readyMaps.length} fincas auditadas)`,
      });

      // Detectar si el dispositivo es móvil/celular/tablet
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;

      if (isMobile) {
        // En celular: Intentar abrir menú de envío del sistema (WhatsApp, Gmail, etc.)
        try {
          const pdfFile = new File([result.blob], result.filename, { type: 'application/pdf' });
          if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
            await navigator.share({
              title: `Reporte Consolidado DOLE - ${targetSupervisor.name}`,
              text: `Reporte unificado de iluminación con ${readyMaps.length} fincas.`,
              files: [pdfFile],
            });
            notify('Menú de envío completado.');
            return;
          }
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') {
            notify('Envío cancelado por el usuario.');
            return;
          }
          console.warn('Web Share no disponible, procediendo a descarga normal:', shareErr);
        }
      }

      // En PC o si el menú móvil no está disponible: Descarga directa
      const a = document.createElement('a');
      a.href = result.url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      if (omittedMaps.length > 0) {
        notify(`PDF generado con ${readyMaps.length} fincas editadas (${omittedMaps.length} omitidas sin editar).`);
      } else {
        notify(`PDF Unificado descargado con éxito (${readyMaps.length} fincas).`);
      }
    } catch (e) {
      console.error('Error generando PDF unificado:', e);
      notify('No se pudo generar el reporte PDF consolidado.');
    } finally {
      setIsQuickDownloading(false);
    }
  };

  // 1-Click Individual farm sheet PDF
  const handleDownloadSinglePdf = async (mapRecord: FarmMapRecord) => {
    const supervisor = supervisors.find((s) => s.id === mapRecord.supervisorId) || {
      id: mapRecord.supervisorId,
      name: mapRecord.supervisorName,
      category: mapRecord.cropCategory,
      employeeCode: 'DOL-SUP-AUTO',
      email: 'supervision@dole.com',
      createdAt: Date.now(),
    };

    try {
      const today = new Date().toISOString().split('T')[0];
      const nowTime = new Date().toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit', hour12: true });
      const result = await generateConsolidatedPdf({
        supervisor,
        date: mapRecord.inspectionDate,
        maps: [mapRecord],
        notes: `Ficha técnica de iluminación para ${mapRecord.farmName}.`,
      });

      // Mark as sent/downloaded for this session
      setSentPdfMapIds((prev) => new Set(prev).add(mapRecord.id));

      const a = document.createElement('a');
      a.href = result.url;
      a.download = `Ficha_${mapRecord.farmName.replace(/\s+/g, '_')}_${mapRecord.inspectionDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      notify(`Ficha de ${mapRecord.farmName} descargada exitosamente.`);
    } catch (e) {
      console.error('Error generating single PDF:', e);
      alert('No se pudo generar la ficha técnica.');
    }
  };

  // File ingestion handler (supports individual photos, multiple images, or .zip compressed archives)
  const processIncomingFiles = async (files: FileList | File[]) => {
    try {
      const { imageFiles, extractedCount, zipCount } = await resolveFilesAndZips(files);

      if (imageFiles.length === 0) {
        if (zipCount > 0) {
          notify('No se encontraron imágenes (.png, .jpg, .webp) dentro de la carpeta comprimida .ZIP.');
        } else {
          notify('Por favor suba imágenes válidas o una carpeta comprimida (.ZIP).');
        }
        return;
      }

      if (zipCount > 0) {
        notify(`Se extrajeron exitosamente ${extractedCount} imágenes del archivo comprimido.`);
      }

      if (imageFiles.length === 1 && zipCount === 0) {
        setModalInitialSupervisor(selectedSupervisor);
        setIsAddMapOpen(true);
      } else {
        setBatchPreloadedFiles(imageFiles);
        setModalInitialSupervisor(selectedSupervisor);
        setIsBatchUploadOpen(true);
      }
    } catch (err) {
      console.error('Error al procesar archivos de entrada:', err);
      notify('Error al descomprimir la carpeta o procesar los archivos.');
    }
  };

  const handleGroupFilesSelected = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    processIncomingFiles(files);
    e.target.value = '';
  };

  const handleDropFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    processIncomingFiles(fileList);
  };

  // Open modals with pre-selected supervisor
  const openAddMapForSupervisor = (supervisor: Supervisor) => {
    setModalInitialSupervisor(supervisor);
    setIsAddMapOpen(true);
  };

  const openConsolidatedPdfForSupervisor = (supervisor: Supervisor) => {
    setModalInitialSupervisor(supervisor);
    setIsConsolidatedPdfOpen(true);
  };

  // Active supervisor maps partitioned by validation status
  const activeSupervisorMaps = farmMaps.filter((m) =>
    activeSupervisorId ? m.supervisorId === activeSupervisorId : false
  );
  const { readyMaps: activeReadyMaps, omittedMaps: activeOmittedMaps } = partitionFarmMaps(activeSupervisorMaps);

  // Filter farm maps: Strictly separated by active supervisor interface and notes validation!
  const filteredMaps = farmMaps.filter((map) => {
    // STRICT SEPARATION: Only display maps belonging to the active supervisor
    const matchesSupervisor = activeSupervisorId ? map.supervisorId === activeSupervisorId : false;
    const matchesCategory = categoryFilter === 'ALL' ? true : map.cropCategory === categoryFilter;
    const matchesSearch = searchQuery.trim()
      ? map.farmName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (map.imageFileName && map.imageFileName.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;

    // Filter by validation status (all, ready/edited, or omitted)
    const isEdited = isFarmInspectionEdited(map);
    const matchesNotes = 
      notesFilter === 'ALL' 
        ? true 
        : notesFilter === 'READY' 
          ? isEdited 
          : !isEdited;

    return matchesSupervisor && matchesCategory && matchesSearch && matchesNotes;
  });

  // Si no ha iniciado sesión con la contraseña requerida (15926), mostrar módulo de inicio de sesión
  if (!isAuthenticated) {
    return (
      <LoginModule
        onLoginSuccess={handleLoginSuccess}
        storedMapsCount={farmMaps.length}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-slate-200 transition-colors duration-300">
      {/* Notificación rápida flotante */}
      {quickNotification && (
        <div className="fixed top-16 right-4 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{quickNotification}</span>
        </div>
      )}

      {/* Top Fixed Navigation con selector de interfaz y color reactivo */}
      <Navbar
        activeTab={activeTab === 'pdf' ? 'all' : activeTab}
        setActiveTab={setActiveTab as any}
        theme={currentTheme}
        supervisors={supervisors}
        selectedSupervisorId={activeSupervisorId}
        onSelectSupervisor={(id) => setSelectedSupervisorId(id)}
        selectedSupervisorName={selectedSupervisor?.name}
        onOpenAddMap={() => {
          setModalInitialSupervisor(selectedSupervisor);
          setIsAddMapOpen(true);
        }}
        onOpenBatchUpload={() => {
          setBatchPreloadedFiles([]);
          setModalInitialSupervisor(selectedSupervisor);
          setIsBatchUploadOpen(true);
        }}
        onOpenAddSupervisor={() => setIsAddSupervisorOpen(true)}
        onOpenConsolidatedPdf={() => {
          setModalInitialSupervisor(selectedSupervisor);
          setIsConsolidatedPdfOpen(true);
        }}
        onQuickDownloadPdf={() => handleUnirTodosLosPdf()}
        isQuickDownloading={isQuickDownloading}
        totalMapsCount={filteredMaps.length}
        totalSupervisorsCount={supervisors.length}
        onOpenLogs={() => setIsLogsOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Banner de Interfaz de Supervisor Activo */}
      <section id="hero-section" className={`border-b transition-colors duration-300 py-5 ${currentTheme.primaryLightBg} ${currentTheme.primaryBorder}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${currentTheme.badgeBg}`}>
                  {selectedSupervisor ? `Interfaz de ${selectedSupervisor.name}` : 'División Agrícola DOLE'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                {selectedSupervisor ? `Interfaz de ${selectedSupervisor.name}` : 'Control de Iluminación de Fincas'}
              </h1>
            </div>

            {/* Indicadores clave del Supervisor Activo */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 rounded-lg border border-slate-200/80 shadow-2xs text-xs font-semibold text-slate-700">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{filteredMaps.length} {filteredMaps.length === 1 ? 'Finca asignada' : 'Fincas asignadas'}</span>
              </div>
            </div>
          </div>

          {/* Opción compacta y profesional para arrastrar grupo de imágenes */}
          <div
            id="dropzone-group-upload"
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDraggingOver(true);
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDraggingOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDraggingOver(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDraggingOver(false);
              handleDropFiles(e.dataTransfer.files);
            }}
            onClick={() => groupDropInputRef.current?.click()}
            className={`mt-3 py-2 px-3.5 sm:px-4 rounded-xl border border-dashed cursor-pointer transition-all duration-200 flex items-center justify-between gap-3 select-none ${
              isDraggingOver
                ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-400/30'
                : 'bg-white/85 hover:bg-white border-slate-300/90 hover:border-slate-400 shadow-2xs'
            }`}
            title="Haga clic o arrastre aquí fotos o carpetas comprimidas .ZIP"
          >
            <input
              ref={groupDropInputRef}
              type="file"
              multiple
              accept="image/*,.zip,application/zip,application/x-zip-compressed"
              onChange={handleGroupFilesSelected}
              className="hidden"
            />
            
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                isDraggingOver ? 'bg-blue-600 text-white' : currentTheme.badgeBg
              }`}>
                <UploadCloud className={`w-3.5 h-3.5 ${isDraggingOver ? 'text-white' : currentTheme.primaryText}`} />
              </div>
              <div className="flex items-center gap-2 truncate">
                <span className="text-xs font-bold text-slate-800 tracking-tight whitespace-nowrap">
                  Arrastra aquí fotos o carpetas comprimidas (.ZIP)
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 shrink-0">
                  <FolderArchive className="w-3 h-3 text-amber-600" />
                  <span>Soporta .ZIP</span>
                </span>
                <span className="text-[11px] text-slate-400 truncate hidden md:inline">
                  • Extrae automáticamente imágenes de carpetas PDF o planos
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-md border transition-colors ${currentTheme.badgeBg}`}>
                Examinar fotos o .ZIP
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-6 py-6">
        {/* Módulo de Supervisores: cambia el color de la app al seleccionar */}
        <SupervisorModule
          supervisors={supervisors}
          farmMaps={farmMaps}
          selectedSupervisorId={selectedSupervisorId}
          currentTheme={currentTheme}
          onSelectSupervisor={(id) => setSelectedSupervisorId(id)}
          onOpenAddMapForSupervisor={openAddMapForSupervisor}
          onOpenConsolidatedPdfForSupervisor={openConsolidatedPdfForSupervisor}
          onQuickDownloadPdf={() => handleUnirTodosLosPdf()}
          onOpenAddSupervisor={() => setIsAddSupervisorOpen(true)}
        />

        {/* Sección de Fincas */}
        <section id="mapas-section" className="space-y-4">
          {/* BARRA DE VALIDACIÓN VISUAL DE FINCAS LISTAS VS OMITIDAS */}
          {activeSupervisorMaps.length > 0 && (
            <div className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              activeOmittedMaps.length > 0 
                ? 'bg-rose-50/90 border-rose-200 ring-1 ring-rose-200/50 shadow-xs' 
                : 'bg-emerald-50/70 border-emerald-300'
            }`}>
              <div className="flex items-start sm:items-center gap-2.5">
                {activeOmittedMaps.length > 0 ? (
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 border border-rose-200">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-emerald-200/80 text-emerald-900 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-800" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                      {activeOmittedMaps.length > 0 
                        ? `Validación: ${activeOmittedMaps.length} ${activeOmittedMaps.length === 1 ? 'finca omitida' : 'fincas omitidas'} del reporte consolidado`
                        : 'Validación Completa: Todas las fincas tienen anotaciones'}
                    </h3>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                      activeOmittedMaps.length > 0
                        ? 'bg-rose-100/70 text-rose-800 border-rose-200'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}>
                      {activeReadyMaps.length} de {activeSupervisorMaps.length} listas
                    </span>
                  </div>
                </div>
              </div>

              {activeOmittedMaps.length > 0 && (
                <button
                  id="btn-open-pending-farms"
                  onClick={() => setIsPendingFarmsModalOpen(true)}
                  className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                  title="Ver y editar observaciones de las fincas omitidas"
                >
                  <FileEdit className="w-3.5 h-3.5" />
                  <span>Ver y Editar Fincas Omitidas ({activeOmittedMaps.length})</span>
                </button>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Fincas Registradas ({filteredMaps.length})
              </h2>
            </div>

            {/* Filtros simples y Filtro de Validación de Cuadro de Diálogo */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar finca o archivo..."
                  className="pl-7 pr-3 py-1.5 rounded-md border border-slate-200 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                />
              </div>

              {/* Filtro por estado de anotación (Validación de diálogo) */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  onClick={() => setNotesFilter('ALL')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                    notesFilter === 'ALL'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Ver todas las fincas"
                >
                  Todas ({activeSupervisorMaps.length})
                </button>
                <button
                  onClick={() => setNotesFilter('READY')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 ${
                    notesFilter === 'READY'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-emerald-800 hover:bg-emerald-100/50'
                  }`}
                  title="Ver fincas con anotación listas para el PDF"
                >
                  <span>✓ En Reporte ({activeReadyMaps.length})</span>
                </button>
                {activeOmittedMaps.length > 0 && (
                  <button
                    onClick={() => setNotesFilter('OMITTED')}
                    className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 ${
                      notesFilter === 'OMITTED'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'text-rose-700 hover:bg-rose-100/60'
                    }`}
                    title="Ver fincas omitidas por falta de anotación"
                  >
                    <span>⚠️ Omitidas ({activeOmittedMaps.length})</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCategoryFilter('ALL')}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    categoryFilter === 'ALL'
                      ? `${currentTheme.primaryBg} text-white`
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Todas
                </button>
                <button
                  onClick={() => setCategoryFilter('Fincas de Banano')}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    categoryFilter === 'Fincas de Banano'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Banano
                </button>
                <button
                  onClick={() => setCategoryFilter('Fincas de Piñas y banano')}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    categoryFilter === 'Fincas de Piñas y banano'
                      ? 'bg-amber-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Piña y Banano
                </button>
              </div>
            </div>
          </div>

          {/* Grid de Fincas (Completamente eliminadas las secciones de día/noche y zonas identificadas) */}
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Cargando mapas...
            </div>
          ) : filteredMaps.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-2">
              <MapPin className="w-6 h-6 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-700">
                No hay fincas para mostrar en la interfaz de {selectedSupervisor?.name || 'este supervisor'}
              </p>
              <button
                onClick={() => {
                  setCategoryFilter('ALL');
                  setSearchQuery('');
                }}
                className="px-3 py-1.5 rounded bg-slate-100 text-xs font-semibold text-slate-700 hover:bg-slate-200"
              >
                Limpiar Búsqueda
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMaps.map((mapRecord) => (
                <FarmMapCard
                  key={mapRecord.id}
                  mapRecord={mapRecord}
                  theme={currentTheme}
                  isPdfSentOrDownloaded={sentPdfMapIds.has(mapRecord.id)}
                  onDownloadSinglePdf={handleDownloadSinglePdf}
                  onDelete={handleDeleteFarmMap}
                  onUpdateMap={handleSaveFarmMap}
                  onUpdateNotes={handleUpdateFarmMapNotes}
                />
              ))}
            </div>
          )}

          {/* ========================================================================= */}
          {/* BOTÓN PRINCIPAL: UNIR TODOS LOS PDF EN UN DOCUMENTO (ROJO, GRANDE)      */}
          {/* ========================================================================= */}
          <div className="pt-6 pb-2">
            <div className="bg-gradient-to-br from-rose-50 to-red-100/60 border-2 border-rose-200/90 rounded-2xl p-5 sm:p-7 text-center shadow-md">
              <div className="max-w-2xl mx-auto space-y-3">
                <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Generar Documento Único de Supervisión
                </h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  Une en un solo archivo PDF las{' '}
                  <strong className="text-emerald-700 font-extrabold">{activeReadyMaps.length} fincas listas con anotación</strong> del supervisor.
                </p>

                {activeOmittedMaps.length > 0 && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setIsPendingFarmsModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-100 text-rose-800 text-xs font-bold border border-rose-200 hover:bg-rose-200 transition-colors cursor-pointer"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Ver {activeOmittedMaps.length} fincas pendientes para editarlas y reenviarlas</span>
                    </button>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    id="btn-unir-todos-los-pdf-principal"
                    disabled={isQuickDownloading || activeSupervisorMaps.length === 0}
                    onClick={() => handleUnirTodosLosPdf()}
                    className="w-full sm:w-auto min-w-[300px] sm:min-w-[440px] py-4 px-8 rounded-2xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black text-base sm:text-lg tracking-wide shadow-xl hover:shadow-2xl active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 border border-red-500 mx-auto select-none cursor-pointer"
                  >
                    {isQuickDownloading ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin text-white" />
                        <span>UNIFICANDO DOCUMENTOS VALIDADOS...</span>
                      </>
                    ) : (
                      <>
                        <FileDown className="w-6 h-6 text-white" />
                        <span>
                          {activeReadyMaps.length > 0 
                            ? `UNIR ${activeReadyMaps.length} FINCAS CON ANOTACIÓN EN UN PDF` 
                            : 'UNIR TODOS LOS PDF EN UN DOCUMENTO'}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Minimalista con Protección contra entrenamiento de IA */}
      <footer className="bg-white border-t border-slate-200 py-4 text-slate-500 text-xs mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2">
          <div className="flex flex-col sm:flex-row items-center justify-end gap-2">
            <span className="flex items-center gap-1.5 text-slate-500 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Imágenes fijas y permanentes en el almacenamiento del dispositivo</span>
            </span>
          </div>
          
          {/* Cláusula de protección de código contra entrenamiento de IA */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-1 text-[10px] text-slate-400">
            <p className="tracking-tight">
              Código fuente y datos protegidos contra minería de datos y entrenamiento de IA (NoAI / NoImageAI).
            </p>
          </div>
        </div>
      </footer>

      {/* Modales */}
      <AddMapModal
        isOpen={isAddMapOpen}
        onClose={() => setIsAddMapOpen(false)}
        supervisors={supervisors}
        initialSupervisor={modalInitialSupervisor}
        theme={currentTheme}
        onSave={handleSaveFarmMap}
        onSaveBatch={handleSaveBatchMaps}
      />

      <BatchUploadModal
        isOpen={isBatchUploadOpen}
        onClose={() => {
          setIsBatchUploadOpen(false);
          setBatchPreloadedFiles([]);
        }}
        supervisors={supervisors}
        initialSupervisor={modalInitialSupervisor}
        theme={currentTheme}
        preloadedFiles={batchPreloadedFiles}
        onSaveBatch={handleSaveBatchMaps}
      />

      <AddSupervisorModal
        isOpen={isAddSupervisorOpen}
        onClose={() => setIsAddSupervisorOpen(false)}
        onSave={handleSaveSupervisor}
      />

      <ConsolidatedPdfModal
        isOpen={isConsolidatedPdfOpen}
        onClose={() => setIsConsolidatedPdfOpen(false)}
        supervisors={supervisors}
        farmMaps={farmMaps}
        initialSupervisor={modalInitialSupervisor}
        onUpdateNotes={handleUpdateFarmMapNotes}
      />

      {/* Modal de Validación y Edición de Fincas Omitidas/Pendientes */}
      <PendingFarmsModal
        isOpen={isPendingFarmsModalOpen}
        onClose={() => setIsPendingFarmsModalOpen(false)}
        farmMaps={activeSupervisorMaps}
        supervisorName={selectedSupervisor?.name || 'Supervisor'}
        onSaveNote={handleUpdateFarmMapNotes}
        onGeneratePdfNow={() => {
          setIsPendingFarmsModalOpen(false);
          handleUnirTodosLosPdf();
        }}
      />

      {/* Módulo de Ayuda didáctica */}
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      {/* Módulo de Registro de Conexiones */}
      <ConnectionLogsModal
        isOpen={isLogsOpen}
        onClose={() => setIsLogsOpen(false)}
      />
    </div>
  );
}
