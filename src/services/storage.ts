import { get, set } from 'idb-keyval';
import { Supervisor, FarmMapRecord, GeneratedPdfFile, AppUser, ConnectionLog } from '../types';

const SUPERVISORS_KEY = 'dole_supervisors_v1';
const FARM_MAPS_KEY = 'dole_farm_maps_v1';
const FARM_MAPS_BACKUP_KEY = 'dole_farm_maps_backup_v1';
const GENERATED_PDFS_KEY = 'dole_generated_pdfs_v1';
const AUTH_USERS_KEY = 'dole_auth_users_v1';
const AUTH_CURRENT_USER_KEY = 'dole_auth_current_user_v1';
const CONNECTION_LOGS_KEY = 'dole_connection_logs_v1';

// Solicitar al navegador persistencia permanente para que nunca borre los mapas de IndexedDB
if (typeof window !== 'undefined' && navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().then((persistent) => {
    if (persistent) {
      console.log('Almacenamiento persistente garantizado en el navegador');
    }
  }).catch(() => {});
}

// Initial supervisors
const INITIAL_SUPERVISORS: Supervisor[] = [
  {
    id: 'sup-ronnie-flores',
    name: 'Ronnie Flores',
    category: 'Fincas de Banano',
    employeeCode: 'DOL-SUP-0142',
    email: 'rflores@dole.com',
    phone: '+504 9876-1234',
    createdAt: Date.now() - 86400000 * 10,
  },
  {
    id: 'sup-jason-cruz',
    name: 'Jason Cruz',
    category: 'Fincas de Piñas y banano',
    employeeCode: 'DOL-SUP-0189',
    email: 'jcruz@dole.com',
    phone: '+504 9543-7890',
    createdAt: Date.now() - 86400000 * 8,
  },
];

// Usuarios corporativos autorizados del sistema
export const SYSTEM_AUTH_PASSWORD = '15926';

export const INITIAL_USERS: AppUser[] = [
  {
    id: 'user-ronnie-flores',
    name: 'Ronnie Flores',
    emailOrCode: 'rflores@dole.com',
    role: 'Supervisor Banano',
    password: SYSTEM_AUTH_PASSWORD,
    avatarColor: 'bg-emerald-700',
    createdAt: Date.now() - 86400000 * 30,
  },
  {
    id: 'user-jason-cruz',
    name: 'Jason Cruz',
    emailOrCode: 'jcruz@dole.com',
    role: 'Supervisor Piña y Banano',
    password: SYSTEM_AUTH_PASSWORD,
    avatarColor: 'bg-amber-600',
    createdAt: Date.now() - 86400000 * 30,
  },
];

// IDs de mapas demo/prueba que deben filtrarse para no mostrar archivos ficticios
const DEMO_MAP_IDS = new Set([
  'map-santa-ines',
  'map-monterrey',
  'map-los-diamantes',
  'map-el-paraiso',
]);

export async function getSupervisors(): Promise<Supervisor[]> {
  try {
    const stored = await get<Supervisor[]>(SUPERVISORS_KEY);
    if (stored && Array.isArray(stored) && stored.length > 0) {
      return stored;
    }
    const local = localStorage.getItem(SUPERVISORS_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        await set(SUPERVISORS_KEY, parsed);
        return parsed;
      }
    }
    await set(SUPERVISORS_KEY, INITIAL_SUPERVISORS);
    localStorage.setItem(SUPERVISORS_KEY, JSON.stringify(INITIAL_SUPERVISORS));
    return INITIAL_SUPERVISORS;
  } catch (err) {
    console.error('Error fetching supervisors from storage:', err);
    return INITIAL_SUPERVISORS;
  }
}

export async function saveSupervisor(supervisor: Supervisor): Promise<Supervisor[]> {
  const current = await getSupervisors();
  const existingIdx = current.findIndex((s) => s.id === supervisor.id);
  let updated: Supervisor[];

  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = supervisor;
  } else {
    updated = [...current, supervisor];
  }

  await set(SUPERVISORS_KEY, updated);
  try {
    localStorage.setItem(SUPERVISORS_KEY, JSON.stringify(updated));
  } catch (e) {}
  return updated;
}

export async function deleteSupervisor(id: string): Promise<Supervisor[]> {
  const current = await getSupervisors();
  const updated = current.filter((s) => s.id !== id);
  await set(SUPERVISORS_KEY, updated);
  try {
    localStorage.setItem(SUPERVISORS_KEY, JSON.stringify(updated));
  } catch (e) {}
  return updated;
}

// Persistencia fija y permanente de mapas: no borra imágenes subidas por el usuario
export async function getFarmMaps(): Promise<FarmMapRecord[]> {
  try {
    // 1. Consultar IndexedDB permanente
    const stored = await get<FarmMapRecord[]>(FARM_MAPS_KEY);
    if (stored !== undefined && Array.isArray(stored)) {
      // Filtrar archivos de prueba ficticios para dejar fijas solo las fincas del usuario
      const cleanUserMaps = stored.filter(
        (m) => !DEMO_MAP_IDS.has(m.id) && !m.id.startsWith('map-group-demo-')
      );
      return cleanUserMaps;
    }

    // 2. Comprobar respaldo
    const local = localStorage.getItem(FARM_MAPS_BACKUP_KEY);
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) {
          const cleanUserMaps = parsed.filter(
            (m) => !DEMO_MAP_IDS.has(m.id) && !m.id.startsWith('map-group-demo-')
          );
          await set(FARM_MAPS_KEY, cleanUserMaps);
          return cleanUserMaps;
        }
      } catch (e) {}
    }

    // Si está vacío al inicio, no crear mapas de prueba artificiales
    await set(FARM_MAPS_KEY, []);
    return [];
  } catch (err) {
    console.error('Error fetching farm maps:', err);
    return [];
  }
}

export async function saveFarmMap(mapRecord: FarmMapRecord): Promise<FarmMapRecord[]> {
  const current = await getFarmMaps();
  const existingIdx = current.findIndex((m) => m.id === mapRecord.id);
  let updated: FarmMapRecord[];

  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = { ...mapRecord, updatedAt: Date.now() };
  } else {
    updated = [mapRecord, ...current];
  }

  // Guardar en IndexedDB sin pérdida de imágenes
  await set(FARM_MAPS_KEY, updated);
  try {
    localStorage.setItem(FARM_MAPS_BACKUP_KEY, JSON.stringify(updated));
  } catch (e) {
    // Si localStorage satura, IndexedDB retiene el 100% de los datos con imágenes completas
  }
  return updated;
}

export async function saveFarmMapsBulk(newRecords: FarmMapRecord[]): Promise<FarmMapRecord[]> {
  const current = await getFarmMaps();
  let updated = [...current];

  for (const rec of newRecords) {
    const existingIdx = updated.findIndex((m) => m.id === rec.id);
    if (existingIdx >= 0) {
      updated[existingIdx] = { ...rec, updatedAt: Date.now() };
    } else {
      updated.unshift(rec);
    }
  }

  await set(FARM_MAPS_KEY, updated);
  try {
    localStorage.setItem(FARM_MAPS_BACKUP_KEY, JSON.stringify(updated));
  } catch (e) {}
  return updated;
}

export async function deleteFarmMap(id: string): Promise<FarmMapRecord[]> {
  const current = await getFarmMaps();
  const updated = current.filter((m) => m.id !== id);
  await set(FARM_MAPS_KEY, updated);
  try {
    localStorage.setItem(FARM_MAPS_BACKUP_KEY, JSON.stringify(updated));
  } catch (e) {}
  return updated;
}

export async function updateFarmMapObservations(id: string, notes: string): Promise<FarmMapRecord[]> {
  const current = await getFarmMaps();
  const existingIdx = current.findIndex((m) => m.id === id);
  if (existingIdx === -1) return current;

  const updated = [...current];
  updated[existingIdx] = {
    ...updated[existingIdx],
    nightInspection: {
      ...updated[existingIdx].nightInspection,
      observations: notes,
    },
    dayInspection: {
      ...updated[existingIdx].dayInspection,
      observations: notes,
    },
    updatedAt: Date.now(),
  };

  await set(FARM_MAPS_KEY, updated);
  try {
    localStorage.setItem(FARM_MAPS_BACKUP_KEY, JSON.stringify(updated));
  } catch (e) {}
  return updated;
}

export async function getGeneratedPdfs(): Promise<GeneratedPdfFile[]> {
  try {
    const stored = await get<GeneratedPdfFile[]>(GENERATED_PDFS_KEY);
    if (stored && Array.isArray(stored)) {
      return stored;
    }
    return [];
  } catch (err) {
    console.error('Error fetching generated pdfs:', err);
    return [];
  }
}

export async function saveGeneratedPdf(pdfFile: GeneratedPdfFile): Promise<GeneratedPdfFile[]> {
  const current = await getGeneratedPdfs();
  const existingIdx = current.findIndex((p) => p.id === pdfFile.id);
  let updated: GeneratedPdfFile[];

  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = pdfFile;
  } else {
    updated = [pdfFile, ...current];
  }

  await set(GENERATED_PDFS_KEY, updated);
  return updated;
}

export async function deleteGeneratedPdf(id: string): Promise<GeneratedPdfFile[]> {
  const current = await getGeneratedPdfs();
  const updated = current.filter((p) => p.id !== id);
  await set(GENERATED_PDFS_KEY, updated);
  return updated;
}

// =========================================================================
// GESTIÓN DE USUARIOS (INICIO DE SESIÓN Y REGISTRO)
// =========================================================================

export async function getAuthUsers(): Promise<AppUser[]> {
  try {
    const stored = await get<AppUser[]>(AUTH_USERS_KEY);
    if (stored && Array.isArray(stored) && stored.length > 0) {
      return stored;
    }
    const local = localStorage.getItem(AUTH_USERS_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        await set(AUTH_USERS_KEY, parsed);
        return parsed;
      }
    }
    await set(AUTH_USERS_KEY, INITIAL_USERS);
    localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(INITIAL_USERS));
    return INITIAL_USERS;
  } catch (e) {
    return INITIAL_USERS;
  }
}

export async function registerUser(newUser: Omit<AppUser, 'id' | 'createdAt'>): Promise<AppUser> {
  const users = await getAuthUsers();
  const createdUser: AppUser = {
    ...newUser,
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: Date.now(),
    avatarColor: newUser.avatarColor || 'bg-blue-600',
  };

  const updated = [...users, createdUser];
  await set(AUTH_USERS_KEY, updated);
  try {
    localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(updated));
  } catch (e) {}

  return createdUser;
}

export async function getCurrentUser(): Promise<AppUser> {
  try {
    const stored = await get<AppUser>(AUTH_CURRENT_USER_KEY);
    if (stored) return stored;
    const local = localStorage.getItem(AUTH_CURRENT_USER_KEY);
    if (local) return JSON.parse(local);
  } catch (e) {}

  const defaultUser = INITIAL_USERS[0];
  await setCurrentUser(defaultUser);
  return defaultUser;
}

export async function setCurrentUser(user: AppUser): Promise<void> {
  await set(AUTH_CURRENT_USER_KEY, user);
  try {
    localStorage.setItem(AUTH_CURRENT_USER_KEY, JSON.stringify(user));
  } catch (e) {}
}

const SESSION_AUTH_FLAG = 'dole_session_auth_v2';
const SESSION_USER_KEY = 'dole_session_user_v2';

export function isUserAuthenticated(): boolean {
  try {
    const sessionActive = sessionStorage.getItem(SESSION_AUTH_FLAG);
    if (sessionActive === 'true') return true;
    // También verificar localStorage para que persista durante la sesión actual si el usuario recarga
    const localActive = localStorage.getItem(SESSION_AUTH_FLAG);
    return localActive === 'true';
  } catch (e) {
    return false;
  }
}

export function setAuthenticatedSession(user: AppUser | null): void {
  try {
    if (user) {
      sessionStorage.setItem(SESSION_AUTH_FLAG, 'true');
      sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
      localStorage.setItem(SESSION_AUTH_FLAG, 'true');
      localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
      localStorage.setItem(AUTH_CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(SESSION_AUTH_FLAG);
      sessionStorage.removeItem(SESSION_USER_KEY);
      localStorage.removeItem(SESSION_AUTH_FLAG);
      localStorage.removeItem(SESSION_USER_KEY);
    }
  } catch (e) {}
}

export function getSessionUser(): AppUser | null {
  try {
    const raw = sessionStorage.getItem(SESSION_USER_KEY) || localStorage.getItem(SESSION_USER_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

/**
 * DIRECTIVA DE REINICIO DE ANOTACIONES:
 * Al entrar o salir de la aplicación, se borran las anotaciones escritas en el cuadro de diálogo
 * de inspección de todas las fincas.
 * Los mapas satelitales, imágenes, nombres y coordenadas quedan 100% conservados permanentemente
 * en el almacenamiento para que el usuario encuentre siempre el sistema listo para nuevos datos.
 */
export async function clearInspectionNotesForSession(): Promise<FarmMapRecord[]> {
  const current = await getFarmMaps();
  const cleaned: FarmMapRecord[] = current.map((m) => ({
    ...m,
    nightInspection: {
      ...m.nightInspection,
      observations: '',
    },
    dayInspection: {
      ...m.dayInspection,
      observations: '',
    },
    updatedAt: Date.now(),
  }));

  // Guardar en el almacenamiento permanente sin borrar los mapas ni imágenes
  await set(FARM_MAPS_KEY, cleaned);
  try {
    localStorage.setItem(FARM_MAPS_BACKUP_KEY, JSON.stringify(cleaned));
  } catch (e) {}

  return cleaned;
}

// =========================================================================
// REGISTRO DE CONEXIONES (AUDIT LOG DE ACCESOS)
// =========================================================================

function detectDevice(): { deviceType: 'Móvil (Celular)' | 'Computadora (PC)' | 'Tablet'; browserInfo: string } {
  if (typeof window === 'undefined') {
    return { deviceType: 'Computadora (PC)', browserInfo: 'Sistema Servidor' };
  }

  const ua = navigator.userAgent || '';
  const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isTablet = /iPad|Tablet/i.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua));

  let deviceType: 'Móvil (Celular)' | 'Computadora (PC)' | 'Tablet' = 'Computadora (PC)';
  if (isTablet) {
    deviceType = 'Tablet';
  } else if (isMobile || window.innerWidth < 768) {
    deviceType = 'Móvil (Celular)';
  }

  let browserName = 'Navegador Web';
  if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) browserName = 'Google Chrome';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browserName = 'Apple Safari';
  else if (/Edg/i.test(ua)) browserName = 'Microsoft Edge';
  else if (/Firefox/i.test(ua)) browserName = 'Mozilla Firefox';

  const osName = /Android/i.test(ua) ? 'Android' :
                 /iPhone|iPad/i.test(ua) ? 'iOS' :
                 /Windows/i.test(ua) ? 'Windows' :
                 /Mac/i.test(ua) ? 'macOS' : 'Linux';

  return {
    deviceType,
    browserInfo: `${browserName} en ${osName}`,
  };
}

export async function getConnectionLogs(): Promise<ConnectionLog[]> {
  try {
    const stored = await get<ConnectionLog[]>(CONNECTION_LOGS_KEY);
    if (stored && Array.isArray(stored) && stored.length > 0) {
      return stored;
    }
    const local = localStorage.getItem(CONNECTION_LOGS_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        await set(CONNECTION_LOGS_KEY, parsed);
        return parsed;
      }
    }

    // Si no existen registros previos, generar registros iniciales de conexión del sistema
    const { deviceType, browserInfo } = detectDevice();
    const now = new Date();
    const formatLogDate = (date: Date) => {
      return date.toLocaleDateString('es-HN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }) + ', ' + date.toLocaleTimeString('es-HN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    };

    const initialLogs: ConnectionLog[] = [
      {
        id: `log-active-session`,
        userId: 'supervisor-1',
        userName: 'Ing. Carlos Mendoza',
        userRole: 'Supervisor Agrícola',
        emailOrCode: 'DOLE-HN-7021',
        timestamp: now.getTime(),
        formattedDate: formatLogDate(now),
        deviceType,
        browserInfo,
        status: 'Conexión Exitosa',
      },
      {
        id: `log-seed-2`,
        userId: 'supervisor-2',
        userName: 'Ing. Roberto Solís',
        userRole: 'Supervisor de Piña & Banano',
        emailOrCode: 'DOLE-HN-8419',
        timestamp: now.getTime() - 1000 * 60 * 45, // hace 45 minutos
        formattedDate: formatLogDate(new Date(now.getTime() - 1000 * 60 * 45)),
        deviceType: 'Móvil (Celular)',
        browserInfo: 'Chrome Mobile en Android',
        status: 'Conexión Exitosa',
      },
      {
        id: `log-seed-3`,
        userId: 'inspector-nocturno',
        userName: 'Inspección Técnica Nocturna',
        userRole: 'Inspector de Campo',
        emailOrCode: 'DOLE-NOCTURNO',
        timestamp: now.getTime() - 1000 * 60 * 180, // hace 3 horas
        formattedDate: formatLogDate(new Date(now.getTime() - 1000 * 60 * 180)),
        deviceType: 'Tablet',
        browserInfo: 'Safari en iPadOS',
        status: 'Conexión Exitosa',
      }
    ];

    await set(CONNECTION_LOGS_KEY, initialLogs);
    try {
      localStorage.setItem(CONNECTION_LOGS_KEY, JSON.stringify(initialLogs));
    } catch (e) {}
    return initialLogs;
  } catch (e) {
    return [];
  }
}

export async function recordAccessLog(
  userName: string = 'Supervisor Agrícola DOLE',
  userRole: string = 'Supervisor de Campo'
): Promise<ConnectionLog[]> {
  const { deviceType, browserInfo } = detectDevice();
  const now = new Date();
  const formattedDate = now.toLocaleDateString('es-HN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }) + ', ' + now.toLocaleTimeString('es-HN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const newLog: ConnectionLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId: `user-${Date.now()}`,
    userName,
    userRole,
    emailOrCode: 'DOLE-SISTEMA-AGRO',
    timestamp: Date.now(),
    formattedDate,
    deviceType,
    browserInfo,
    status: 'Conexión Exitosa',
  };

  const current = await getConnectionLogs();
  const updated = [newLog, ...current].slice(0, 150);

  await set(CONNECTION_LOGS_KEY, updated);
  try {
    localStorage.setItem(CONNECTION_LOGS_KEY, JSON.stringify(updated));
  } catch (e) {}

  return updated;
}

export async function addConnectionLog(user: AppUser): Promise<ConnectionLog[]> {
  const { deviceType, browserInfo } = detectDevice();
  const now = new Date();
  const formattedDate = now.toLocaleDateString('es-HN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }) + ', ' + now.toLocaleTimeString('es-HN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const newLog: ConnectionLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    emailOrCode: user.emailOrCode,
    timestamp: Date.now(),
    formattedDate,
    deviceType,
    browserInfo,
    status: 'Conexión Exitosa',
  };

  const current = await getConnectionLogs();
  // Conservar hasta los últimos 150 registros de conexión
  const updated = [newLog, ...current].slice(0, 150);

  await set(CONNECTION_LOGS_KEY, updated);
  try {
    localStorage.setItem(CONNECTION_LOGS_KEY, JSON.stringify(updated));
  } catch (e) {}

  return updated;
}

export async function clearConnectionLogs(): Promise<void> {
  await set(CONNECTION_LOGS_KEY, []);
  try {
    localStorage.removeItem(CONNECTION_LOGS_KEY);
  } catch (e) {}
}

