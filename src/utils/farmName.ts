/**
 * Utility to extract a clean, human-readable farm name directly from an uploaded photo or image file name.
 * Eliminates OCR title detection and uses the file's own name directly as requested.
 *
 * Examples:
 * - "Finca Santa Inés.png" -> "Finca Santa Inés"
 * - "finca_san_pablo.jpg" -> "Finca San Pablo"
 * - "finca-el-carmen.jpeg" -> "Finca El Carmen"
 * - "Plano_Finca_Monterrey.png" -> "Plano Finca Monterrey"
 * - "Santa Ines.jpg" -> "Santa Ines"
 */
export function extractFarmNameFromFileName(fileName: string): string {
  if (!fileName || !fileName.trim()) {
    return 'Finca Sin Título';
  }

  // 1. Remove file extension (e.g., .png, .jpg, .jpeg, .webp, .svg, etc.)
  let cleanName = fileName.replace(/\.[^/.]+$/, '').trim();

  // 2. Replace underscores and hyphens with spaces
  cleanName = cleanName.replace(/[_-]+/g, ' ');

  // 3. Normalize multiple consecutive whitespace
  cleanName = cleanName.replace(/\s+/g, ' ').trim();

  // 4. Fallback if empty
  if (!cleanName) {
    return 'Finca Sin Título';
  }

  // 5. If the file name is completely lowercase, capitalize each word nicely
  if (cleanName === cleanName.toLowerCase()) {
    cleanName = cleanName
      .split(' ')
      .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ''))
      .join(' ');
  }

  return cleanName;
}

/**
 * Derives a sanitized file name from the farm name and the original extension.
 */
export function deriveCleanFileName(farmName: string, originalFileName: string): string {
  const extMatch = originalFileName.match(/\.[0-9a-z]+$/i);
  const ext = extMatch ? extMatch[0].toLowerCase() : '.png';
  const clean = farmName
    .trim()
    .replace(/[<>:"/\\|?*]+/g, '')
    .replace(/\s+/g, '_');
  return `${clean || 'Finca'}${ext}`;
}
