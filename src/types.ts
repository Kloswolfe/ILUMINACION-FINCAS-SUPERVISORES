export type CropCategory = 'Fincas de Banano' | 'Fincas de Piñas y banano';

export interface Supervisor {
  id: string;
  name: string;
  category: CropCategory;
  employeeCode: string;
  email: string;
  phone?: string;
  createdAt: number;
}

export interface DayInspectionData {
  totalInspectedPoles: number;
  physicalCondition: 'Excelente' | 'Bueno' | 'Regular' | 'Crítico';
  photocellsStatus: 'Operativas' | 'Con Fallas' | 'Revisión Pendiente';
  daytimeLightsOnAnomaly: number; // Luminarias encendidas innecesariamente de día
  wiringCondition: 'Óptimo' | 'Mantenimiento Requerido' | 'Dañado';
  observations: string;
}

export interface NightInspectionData {
  totalActiveLights: number; // Luminarias encendidas y operativas
  totalDamagedLights: number; // Luminarias apagadas o averiadas
  coveragePercentage: number; // % de cobertura lumínica
  darkZonesDetected: string[]; // Zonas oscuras detectadas
  urgencyLevel: 'Baja' | 'Media' | 'Alta' | 'Crítica';
  observations: string;
}

export interface FarmMapRecord {
  id: string;
  supervisorId: string;
  supervisorName: string;
  farmName: string; // Clean farm name, blue text extracted without "DOLE"
  extractedRawText?: string;
  cropCategory: CropCategory;
  inspectionDate: string; // YYYY-MM-DD
  imageDataUrl: string; // Image map base64
  imageFileName?: string;
  zones: string[];
  dayInspection: DayInspectionData;
  nightInspection: NightInspectionData;
  createdAt: number;
  updatedAt: number;
}

export interface AnalysisResult {
  farmName: string;
  extractedTextSnippet?: string;
  suggestedCropType?: string;
  zones: string[];
  estimatedLuminaires?: number;
  detectedLightingNotes?: string;
  confidence?: string;
}

export interface GeneratedPdfFile {
  id: string;
  filename: string;
  title: string;
  supervisorId: string;
  supervisorName: string;
  farmName: string;
  cropCategory?: string;
  date: string;
  time: string;
  damagedLightsCount: number;
  pdfDataUrl: string;
  fileSizeBytes?: number;
  createdAt: number;
}

export interface AppUser {
  id: string;
  name: string;
  emailOrCode: string;
  role: string;
  password?: string;
  avatarColor?: string;
  createdAt: number;
}

export interface ConnectionLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  emailOrCode: string;
  timestamp: number;
  formattedDate: string;
  deviceType: 'Móvil (Celular)' | 'Computadora (PC)' | 'Tablet';
  browserInfo: string;
  status: 'Conexión Exitosa';
}

