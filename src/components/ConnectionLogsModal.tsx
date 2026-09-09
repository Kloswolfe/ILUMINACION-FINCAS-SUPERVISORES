import { useState, useEffect } from 'react';
import { 
  X, 
  History, 
  Smartphone, 
  Monitor, 
  Tablet, 
  Trash2, 
  Clock, 
  ShieldCheck, 
  RefreshCw,
  UserCheck,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { ConnectionLog } from '../types';
import { getConnectionLogs, clearConnectionLogs, recordAccessLog } from '../services/storage';

interface ConnectionLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectionLogsModal({ isOpen, onClose }: ConnectionLogsModalProps) {
  const [logs, setLogs] = useState<ConnectionLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await getConnectionLogs();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching connection logs:', err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
      setIsConfirmingClear(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClear = async () => {
    await clearConnectionLogs();
    setLogs([]);
    setIsConfirmingClear(false);
  };

  const handleRecordCurrentAccess = async () => {
    setLoading(true);
    try {
      const updated = await recordAccessLog('Supervisor de Turno DOLE', 'Acceso Web Directo');
      setLogs(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    if (deviceType.includes('Móvil') || deviceType.includes('Celular')) {
      return <Smartphone className="w-4 h-4 text-emerald-600" />;
    }
    if (deviceType.includes('Tablet')) {
      return <Tablet className="w-4 h-4 text-purple-600" />;
    }
    return <Monitor className="w-4 h-4 text-blue-600" />;
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado con información corporativa */}
        <div className="bg-slate-900 p-5 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">Registro de Conexiones</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-900 text-blue-200 border border-blue-700">
                  {logs.length} accesos
                </span>
              </div>
              <p className="text-xs text-slate-400">Historial de conexiones de supervisores e inspectores</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
              title="Actualizar registros"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Lista de Registros */}
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
              <p className="text-xs font-semibold text-slate-600">Cargando registros de conexión...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Clock className="w-10 h-10 mx-auto text-slate-300 mb-1" />
              <p className="text-sm font-bold text-slate-700">Aún no hay registros de conexión guardados.</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Los accesos de los supervisores y las sesiones activadas se registran automáticamente con fecha, hora y dispositivo.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                      {getDeviceIcon(log.deviceType)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 truncate text-sm">{log.userName}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 shrink-0">
                          {log.userRole}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="font-mono text-slate-600">@{log.emailOrCode}</span>
                        <span>•</span>
                        <span className="font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{log.status}</span>
                        </span>
                        <span>•</span>
                        <span className="truncate text-slate-600">{log.deviceType}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-left sm:text-right shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                    <div className="text-[11px] font-semibold text-slate-700">{log.formattedDate}</div>
                    <div className="text-[10px] text-slate-400 flex items-center sm:justify-end gap-1 mt-0.5 truncate max-w-[200px]">
                      <ShieldCheck className="w-3 h-3 text-blue-500 shrink-0" />
                      <span className="truncate">{log.browserInfo}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pie de modal con acciones */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div>
            {logs.length > 0 && (
              isConfirmingClear ? (
                <div className="flex items-center gap-2 animate-in fade-in">
                  <span className="text-rose-700 font-bold text-xs">¿Vaciar historial?</span>
                  <button
                    onClick={handleClear}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md font-bold text-xs cursor-pointer shadow-xs"
                  >
                    Sí, vaciar
                  </button>
                  <button
                    onClick={() => setIsConfirmingClear(false)}
                    className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 rounded-md text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsConfirmingClear(true)}
                  className="text-slate-500 hover:text-rose-600 transition-colors flex items-center gap-1.5 font-semibold cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Limpiar historial</span>
                </button>
              )
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRecordCurrentAccess}
              disabled={loading}
              className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200 transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5 disabled:opacity-50"
              title="Registra una nueva entrada de acceso para este dispositivo"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Registrar Conexión Ahora</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors cursor-pointer shadow-xs"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
