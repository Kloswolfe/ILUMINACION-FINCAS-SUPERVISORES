import JSZip from 'jszip';

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp', 'bmp', 'svg', 'gif']);

/**
 * Checks whether a given file is a ZIP compressed archive
 */
export function isZipFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    name.endsWith('.zip') ||
    file.type === 'application/zip' ||
    file.type === 'application/x-zip-compressed' ||
    file.type === 'multipart/x-zip' ||
    file.type === 'application/x-compress'
  );
}

/**
 * Extracts all image files from a ZIP archive, regardless of folder depth
 * (e.g. from a folder named "pdf", "mapas", or root)
 */
export async function extractImagesFromZip(zipFile: File): Promise<File[]> {
  const zip = await JSZip.loadAsync(zipFile);
  const extractedFiles: File[] = [];

  const entries = Object.entries(zip.files);
  for (const [relativePath, entry] of entries) {
    if (entry.dir) continue;

    // Ignore macOS system and hidden files (__MACOSX, .DS_Store, etc.)
    if (
      relativePath.includes('__MACOSX') ||
      relativePath.startsWith('.') ||
      relativePath.includes('/.') ||
      relativePath.toLowerCase().endsWith('.ds_store') ||
      relativePath.toLowerCase().endsWith('thumbs.db')
    ) {
      continue;
    }

    const ext = relativePath.split('.').pop()?.toLowerCase() || '';
    if (IMAGE_EXTENSIONS.has(ext)) {
      const blob = await entry.async('blob');

      // Extract only the file name, without the directory path
      const pathSegments = relativePath.split('/').filter(Boolean);
      const cleanName = pathSegments[pathSegments.length - 1] || `mapa_${Date.now()}.${ext}`;

      let mimeType = 'image/jpeg';
      if (ext === 'png') mimeType = 'image/png';
      else if (ext === 'webp') mimeType = 'image/webp';
      else if (ext === 'svg') mimeType = 'image/svg+xml';
      else if (ext === 'bmp') mimeType = 'image/bmp';
      else if (ext === 'gif') mimeType = 'image/gif';

      const imageFile = new File([blob], cleanName, {
        type: mimeType,
        lastModified: entry.date ? entry.date.getTime() : Date.now(),
      });

      extractedFiles.push(imageFile);
    }
  }

  // Sort by filename naturally (e.g. 1, 2, 10...)
  extractedFiles.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
  );

  return extractedFiles;
}

/**
 * Resolves a mixed list of Files (which may include regular images and/or .zip files).
 * Extracts images from all .zip files and combines them with regular images.
 */
export async function resolveFilesAndZips(
  files: FileList | File[]
): Promise<{ imageFiles: File[]; extractedCount: number; zipCount: number }> {
  const fileArray = Array.from(files);
  const imageFiles: File[] = [];
  let zipCount = 0;
  let extractedCount = 0;

  for (const file of fileArray) {
    if (isZipFile(file)) {
      zipCount++;
      try {
        const fromZip = await extractImagesFromZip(file);
        extractedCount += fromZip.length;
        imageFiles.push(...fromZip);
      } catch (err) {
        console.error(`Error al descomprimir archivo ${file.name}:`, err);
      }
    } else if (
      file.type.startsWith('image/') ||
      IMAGE_EXTENSIONS.has(file.name.split('.').pop()?.toLowerCase() || '')
    ) {
      imageFiles.push(file);
    }
  }

  return { imageFiles, extractedCount, zipCount };
}
