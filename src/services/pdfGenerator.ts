import { jsPDF } from 'jspdf';
import { FarmMapRecord, Supervisor } from '../types';

export interface ConsolidatedReportOptions {
  supervisor: Supervisor;
  date: string;
  maps: FarmMapRecord[];
  notes?: string;
  inspectionTime?: string;
  loggedUserName?: string;
}

export interface GeneratedPdfResult {
  doc: jsPDF;
  filename: string;
  blob: Blob;
  url: string;
  dataUrl: string;
  totalDamaged: number;
  farmCount: number;
}

// Convert image or SVG URL to Image element
async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = url;
  });
}

// Render image onto a high-res canvas to ensure high-quality jpeg for jsPDF
async function getImagePngData(dataUrl: string): Promise<{ dataUrl: string; width: number; height: number }> {
  try {
    const img = await loadImage(dataUrl);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || 1200;
    canvas.height = img.naturalHeight || 800;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      return {
        dataUrl: canvas.toDataURL('image/jpeg', 0.95),
        width: canvas.width,
        height: canvas.height,
      };
    }
    return { dataUrl, width: 1200, height: 800 };
  } catch (err) {
    console.error('Error rasterizing map image for PDF:', err);
    return { dataUrl, width: 1200, height: 800 };
  }
}

/**
 * Genera el archivo PDF profesional:
 * 1. Título corporativo DOLE y nombre de la finca
 * 2. Fecha
 * 3. Hora
 * 4. Nombre del supervisor que reporta
 * 5. Imagen del mapa de la finca en alta resolución
 * 6. Anotaciones de la inspección escritas por el supervisor
 * 7. Pie de página institucional oficial
 */
export async function generateConsolidatedPdf(
  options: ConsolidatedReportOptions
): Promise<GeneratedPdfResult> {
  const { supervisor, date, maps, notes, inspectionTime, loggedUserName } = options;

  // Standard A4: 210 x 297 mm
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const totalPages = Math.max(1, maps.length);

  // Corporate Colors
  const DOLE_NAVY = [0, 56, 101]; // #003865
  const DOLE_GOLD = [234, 179, 8]; // #eab308
  const BORDER_COLOR = [203, 213, 225]; // #cbd5e1

  // Format Current Time if not provided
  const reportTime = inspectionTime || new Date().toLocaleTimeString('es-HN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  for (let i = 0; i < maps.length; i++) {
    const farm = maps[i];

    if (i > 0) {
      doc.addPage('a4', 'portrait');
    }

    const pageNumber = i + 1;

    // =========================================================================
    // 1. TÍTULO (CABECERA CORPORATIVA DOLE)
    // =========================================================================
    // Barra superior azul marino
    doc.setFillColor(DOLE_NAVY[0], DOLE_NAVY[1], DOLE_NAVY[2]);
    doc.rect(0, 0, 210, 24, 'F');

    // Emblema DOLE
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(14, 4.5, 28, 15, 2, 2, 'F');
    doc.setTextColor(DOLE_NAVY[0], DOLE_NAVY[1], DOLE_NAVY[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('DOLE', 17.5, 15);

    // Título Principal del Reporte
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('CONTROL DE ILUMINACIÓN DE FINCAS', 46, 10.5);

    // Subtítulo con el Nombre de la Finca en Dorado
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(DOLE_GOLD[0], DOLE_GOLD[1], DOLE_GOLD[2]);
    doc.text(`FINCA: ${farm.farmName.toUpperCase()}`, 46, 17.5);

    // Indicador de página en la esquina derecha del banner
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(226, 232, 240);
    doc.text(`Página ${pageNumber} de ${totalPages}`, 172, 14);

    // Línea de acento dorada
    doc.setFillColor(DOLE_GOLD[0], DOLE_GOLD[1], DOLE_GOLD[2]);
    doc.rect(0, 24, 210, 2, 'F');

    // =========================================================================
    // 2. FECHA, 3. HORA, 4. NOMBRE DEL SUPERVISOR QUE REPORTA
    // =========================================================================
    const metaY = 30;
    const metaWidth = 182;
    const metaHeight = 19;

    // Caja contenedora limpia
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(BORDER_COLOR[0], BORDER_COLOR[1], BORDER_COLOR[2]);
    doc.setLineWidth(0.35);
    doc.roundedRect(14, metaY, metaWidth, metaHeight, 2, 2, 'FD');

    // Columna 1: Fecha
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text('FECHA:', 18, metaY + 6.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text(farm.inspectionDate || date, 18, metaY + 13.5);

    // Columna 2: Hora
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('HORA:', 68, metaY + 6.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text(reportTime, 68, metaY + 13.5);

    // Columna 3: Nombre del Supervisor que Reporta
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(loggedUserName ? 'SUPERVISOR / USUARIO:' : 'SUPERVISOR QUE REPORTA:', 116, metaY + 6.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(DOLE_NAVY[0], DOLE_NAVY[1], DOLE_NAVY[2]);
    const supDisplayName = loggedUserName
      ? `${supervisor.name} • ${loggedUserName}`
      : `${supervisor.name} (${supervisor.employeeCode || 'DOLE'})`;
    doc.text(supDisplayName, 116, metaY + 13.5);

    // Separadores verticales sutiles
    doc.setDrawColor(226, 232, 240);
    doc.line(62, metaY + 3, 62, metaY + 16);
    doc.line(110, metaY + 3, 110, metaY + 16);

    // =========================================================================
    // 5. IMAGEN DEL MAPA DE LA FINCA (AMPLIO Y DE ALTA DEFINICIÓN)
    // =========================================================================
    const mapY = 53;
    const mapWidth = 182;
    const mapHeight = 168; // Área óptima de imagen

    // Marco exterior de la imagen
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(BORDER_COLOR[0], BORDER_COLOR[1], BORDER_COLOR[2]);
    doc.setLineWidth(0.4);
    doc.roundedRect(14, mapY, mapWidth, mapHeight, 2, 2, 'FD');

    // Intentar insertar la imagen del mapa con proporción intacta
    try {
      const pngData = await getImagePngData(farm.imageDataUrl);
      const imgAspect = pngData.width / pngData.height;
      
      const maxInnerW = mapWidth - 6;
      const maxInnerH = mapHeight - 6;
      const boxAspect = maxInnerW / maxInnerH;

      let drawW = maxInnerW;
      let drawH = maxInnerH;

      if (imgAspect > boxAspect) {
        // La imagen es más ancha que el contenedor
        drawW = maxInnerW;
        drawH = maxInnerW / imgAspect;
      } else {
        // La imagen es más alta que el contenedor
        drawH = maxInnerH;
        drawW = maxInnerH * imgAspect;
      }

      const drawX = 14 + 3 + (maxInnerW - drawW) / 2;
      const drawY = mapY + 3 + (maxInnerH - drawH) / 2;

      doc.addImage(pngData.dataUrl, 'JPEG', drawX, drawY, drawW, drawH, undefined, 'FAST');
    } catch (e) {
      console.warn('Could not render farm map image in PDF:', e);
      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184);
      doc.text('[ Vista de Imagen de Mapa de la Finca ]', 65, mapY + 80);
    }

    // =========================================================================
    // 6. ANOTACIONES DE LA INSPECCIÓN (ESCRITAS POR EL USUARIO)
    // =========================================================================
    const notesY = 226;
    const notesWidth = 182;
    const notesHeight = 32;

    doc.setFillColor(250, 252, 255); // Fondo corporativo muy suave
    doc.setDrawColor(BORDER_COLOR[0], BORDER_COLOR[1], BORDER_COLOR[2]);
    doc.setLineWidth(0.35);
    doc.roundedRect(14, notesY, notesWidth, notesHeight, 2, 2, 'FD');

    // Título de la sección de notas
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(DOLE_NAVY[0], DOLE_NAVY[1], DOLE_NAVY[2]);
    doc.text('ANOTACIONES DE LA INSPECCIÓN:', 18, notesY + 7);

    // Contenido escrito por el usuario en las observaciones (mediano y en negrita)
    const userNotesText = (farm.nightInspection?.observations || notes || '').trim();
    const displayNotes = userNotesText.length > 0 
      ? userNotesText 
      : 'Inspección de iluminación y condiciones del sector registradas conforme a normas técnicas.';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42); // slate-900 para máxima legibilidad profesional
    
    // Divide el texto automáticamente para que encaje de forma limpia dentro del cuadro
    const splitNotes = doc.splitTextToSize(displayNotes, notesWidth - 10);
    const maxLines = 4;
    const linesToPrint = splitNotes.slice(0, maxLines);
    doc.text(linesToPrint, 18, notesY + 14, { lineHeightFactor: 1.35 });

    // =========================================================================
    // 7. PIE DE PÁGINA INSTITUCIONAL PROFESIONAL
    // =========================================================================
    const footY = 268;
    doc.setDrawColor(BORDER_COLOR[0], BORDER_COLOR[1], BORDER_COLOR[2]);
    doc.setLineWidth(0.25);
    doc.line(14, footY, 196, footY);

    // Acento dorado sutil
    doc.setFillColor(DOLE_GOLD[0], DOLE_GOLD[1], DOLE_GOLD[2]);
    doc.rect(14, footY - 0.5, 32, 0.8, 'F');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text('Documento Oficial de Supervisión Agrícola • División Tropical DOLE', 14, footY + 5);
    const auditSig = loggedUserName 
      ? `Registro Digital: ${supervisor.name} (Por: ${loggedUserName}) • ${date} ${reportTime}`
      : `Registro Digital: ${supervisor.name} • ${date} ${reportTime}`;
    doc.text(auditSig, 110, footY + 5);
  }

  const cleanSupervisorName = supervisor.name.toLowerCase().replace(/\s+/g, '_');
  const filename = maps.length === 1
    ? `Reporte_Iluminacion_${maps[0].farmName.replace(/\s+/g, '_')}_${date}.pdf`
    : `Reportes_Consolidados_DOLE_${cleanSupervisorName}_${date}.pdf`;

  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const dataUrl = doc.output('dataurlstring');

  return {
    doc,
    filename,
    blob,
    url,
    dataUrl,
    totalDamaged: 0,
    farmCount: maps.length,
  };
}
