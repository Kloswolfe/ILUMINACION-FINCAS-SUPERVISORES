// Helper to generate realistic Dole farm map images as Data URLs
export function createFarmMapSvg(
  farmName: string,
  cropType: 'Banano' | 'Piña y Banano',
  activeLightsCount: number,
  damagedLightsCount: number
): string {
  const isPineapple = cropType.includes('Piña');
  const cropColor = isPineapple ? '#eab308' : '#16a34a';
  const cropBg = isPineapple ? '#fef08a' : '#bbf7d0';

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600" width="900" height="600">
    <defs>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" stroke-width="1"/>
      </pattern>
      <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#003865" />
        <stop offset="100%" stop-color="#005a9c" />
      </linearGradient>
    </defs>

    <!-- Background -->
    <rect width="900" height="600" fill="#f8fafc" />
    <rect width="900" height="600" fill="url(#grid)" />

    <!-- Outer Border -->
    <rect x="15" y="15" width="870" height="570" fill="none" stroke="#003865" stroke-width="3" rx="8" />

    <!-- Top Dole Header Banner (To test excluding DOLE during OCR) -->
    <rect x="25" y="25" width="850" height="60" fill="url(#headerGrad)" rx="6" />
    <text x="50" y="58" font-family="'Public Sans', sans-serif" font-size="20" font-weight="900" fill="#fbbf24" letter-spacing="3">DOLE</text>
    <text x="130" y="58" font-family="'Public Sans', sans-serif" font-size="14" font-weight="600" fill="#ffffff">DIVISIÓN AGRÍCOLA - MAPA TÉCNICO DE COBERTURA DE ILUMINACIÓN</text>
    <text x="730" y="58" font-family="'Public Sans', sans-serif" font-size="12" font-weight="500" fill="#94a3b8">REV. 2026-NOC</text>

    <!-- FARM NAME IN BLUE TEXT (as specified in prompt: "esta escrito de color azul") -->
    <rect x="25" y="95" width="540" height="45" fill="#eff6ff" stroke="#93c5fd" stroke-width="1.5" rx="6" />
    <text x="45" y="124" font-family="'Public Sans', sans-serif" font-size="18" font-weight="800" fill="#1d4ed8" letter-spacing="1">
      ${farmName.toUpperCase()}
    </text>
    <rect x="580" y="95" width="295" height="45" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1.5" rx="6" />
    <text x="595" y="122" font-family="'Public Sans', sans-serif" font-size="13" font-weight="700" fill="#334155">
      TIPO: ${cropType.toUpperCase()}
    </text>

    <!-- Sector Zones Layout -->
    <!-- Zone 1: Empacadora & Dársena -->
    <rect x="50" y="160" width="360" height="190" fill="#ffffff" stroke="#64748b" stroke-width="2" rx="4" />
    <rect x="50" y="160" width="360" height="30" fill="#475569" />
    <text x="65" y="180" font-family="sans-serif" font-size="13" font-weight="700" fill="#ffffff">ZONA A: PLANTA EMPACADORA Y ANDÉN DE CARGA</text>
    
    <rect x="70" y="210" width="140" height="110" fill="#f1f5f9" stroke="#94a3b8" />
    <text x="80" y="260" font-family="sans-serif" font-size="11" fill="#475569">Área de Clasificación</text>
    <rect x="230" y="210" width="160" height="110" fill="#f1f5f9" stroke="#94a3b8" />
    <text x="245" y="260" font-family="sans-serif" font-size="11" fill="#475569">Andén Contenedores</text>

    <!-- Zone 2: Lotes de Cultivo -->
    <rect x="440" y="160" width="410" height="190" fill="${cropBg}" stroke="${cropColor}" stroke-width="2" rx="4" />
    <rect x="440" y="160" width="410" height="30" fill="${cropColor}" />
    <text x="455" y="180" font-family="sans-serif" font-size="13" font-weight="700" fill="#ffffff">ZONA B: LOTES DE PRODUCCIÓN (${cropType})</text>
    
    <!-- Lotes subdivisions -->
    <line x1="570" y1="190" x2="570" y2="350" stroke="${cropColor}" stroke-width="1.5" stroke-dasharray="4" />
    <line x1="710" y1="190" x2="710" y2="350" stroke="${cropColor}" stroke-width="1.5" stroke-dasharray="4" />
    <text x="490" y="270" font-family="sans-serif" font-size="12" font-weight="600" fill="#1e293b">Lote 01</text>
    <text x="620" y="270" font-family="sans-serif" font-size="12" font-weight="600" fill="#1e293b">Lote 02</text>
    <text x="760" y="270" font-family="sans-serif" font-size="12" font-weight="600" fill="#1e293b">Lote 03</text>

    <!-- Zone 3: Vías de Acceso, Cablevía y Talleres -->
    <rect x="50" y="370" width="800" height="130" fill="#ffffff" stroke="#64748b" stroke-width="2" rx="4" />
    <rect x="50" y="370" width="800" height="25" fill="#334155" />
    <text x="65" y="387" font-family="sans-serif" font-size="12" font-weight="700" fill="#ffffff">ZONA C: PERÍMETRO, TALLERES MECÁNICOS Y CABLEVÍA PRINCIPAL</text>
    
    <!-- Road -->
    <path d="M 50 445 L 850 445" stroke="#94a3b8" stroke-width="20" stroke-linecap="round"/>
    <path d="M 50 445 L 850 445" stroke="#fef08a" stroke-width="2" stroke-dasharray="8 8"/>

    <!-- Light Poles / Luminarias Symbols -->
    <!-- Active lights (Yellow dots with glow) -->
    <g id="active-lights">
      <circle cx="80" cy="205" r="7" fill="#eab308" stroke="#ca8a04" stroke-width="2" />
      <circle cx="200" cy="205" r="7" fill="#eab308" stroke="#ca8a04" stroke-width="2" />
      <circle cx="240" cy="205" r="7" fill="#eab308" stroke="#ca8a04" stroke-width="2" />
      <circle cx="380" cy="205" r="7" fill="#eab308" stroke="#ca8a04" stroke-width="2" />
      <circle cx="450" cy="205" r="7" fill="#eab308" stroke="#ca8a04" stroke-width="2" />
      <circle cx="580" cy="205" r="7" fill="#eab308" stroke="#ca8a04" stroke-width="2" />
      <circle cx="720" cy="205" r="7" fill="#eab308" stroke="#ca8a04" stroke-width="2" />
      <circle cx="830" cy="205" r="7" fill="#eab308" stroke="#ca8a04" stroke-width="2" />

      <circle cx="100" cy="425" r="7" fill="#eab308" stroke="#ca8a04" stroke-width="2" />
      <circle cx="280" cy="425" r="7" fill="#eab308" stroke="#ca8a04" stroke-width="2" />
      <circle cx="460" cy="425" r="7" fill="#eab308" stroke="#ca8a04" stroke-width="2" />
      <circle cx="640" cy="425" r="7" fill="#eab308" stroke="#ca8a04" stroke-width="2" />
    </g>

    <!-- Damaged / Dark lights (Red / Gray dots) -->
    <g id="damaged-lights">
      <circle cx="310" cy="330" r="7" fill="#ef4444" stroke="#b91c1c" stroke-width="2" />
      <line x1="305" y1="325" x2="315" y2="335" stroke="#ffffff" stroke-width="2" />
      <line x1="315" y1="325" x2="305" y2="335" stroke="#ffffff" stroke-width="2" />

      <circle cx="820" cy="425" r="7" fill="#ef4444" stroke="#b91c1c" stroke-width="2" />
      <line x1="815" y1="420" x2="825" y2="430" stroke="#ffffff" stroke-width="2" />
      <line x1="825" y1="420" x2="815" y2="430" stroke="#ffffff" stroke-width="2" />
    </g>

    <!-- Legend Box at bottom -->
    <rect x="50" y="520" width="800" height="50" fill="#ffffff" stroke="#cbd5e1" rx="4" />
    <circle cx="80" cy="545" r="6" fill="#eab308" stroke="#ca8a04" stroke-width="1.5" />
    <text x="95" y="549" font-family="sans-serif" font-size="12" font-weight="600" fill="#334155">Luminaria Operativa (${activeLightsCount})</text>

    <circle cx="280" cy="545" r="6" fill="#ef4444" stroke="#b91c1c" stroke-width="1.5" />
    <text x="295" y="549" font-family="sans-serif" font-size="12" font-weight="600" fill="#334155">Luminaria Averiada / Apagada (${damagedLightsCount})</text>

    <rect x="520" y="538" width="14" height="14" fill="#1d4ed8" rx="2" />
    <text x="542" y="549" font-family="sans-serif" font-size="11" font-weight="600" fill="#1d4ed8">Nombre de Finca Registrado en Azul</text>
    
    <text x="740" y="549" font-family="sans-serif" font-size="11" font-weight="500" fill="#64748b">Escala 1:2500</text>
  </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
