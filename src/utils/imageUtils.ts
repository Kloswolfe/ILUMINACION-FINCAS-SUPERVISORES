/**
 * Image optimization utilities for farm map photos.
 * Ensures farm map images fit cleanly in persistent browser storage (IndexedDB + localStorage)
 * without exceeding memory or storage quotas.
 */
export async function optimizeImageDataUrl(
  dataUrl: string, 
  maxWidth = 1600, 
  quality = 0.85
): Promise<string> {
  if (!dataUrl) return '';
  // Keep SVG templates intact
  if (dataUrl.startsWith('data:image/svg+xml')) {
    return dataUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // If already small enough (< 400KB and within dimensions), don't re-compress
      if (width <= maxWidth && height <= maxWidth && dataUrl.length < 400000) {
        resolve(dataUrl);
        return;
      }

      if (width > maxWidth || height > maxWidth) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxWidth) / height);
          height = maxWidth;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      try {
        const optimized = canvas.toDataURL('image/jpeg', quality);
        resolve(optimized);
      } catch (e) {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
