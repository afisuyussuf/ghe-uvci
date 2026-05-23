/**
 * GHE UVCI - Université Virtuelle de Côte d'Ivoire
 * Resilient image and logo helpers for jsPDF to prevent format/signature issues
 */

let memoizedLogoBase64: string | null = null;

/**
 * Fetches the application logo and converts it to a standard base64 Data URL.
 * Under high-restriction sandboxes or if CORS / file-not-found issues occur,
 * it falls back to a valid transparent 1x1 PNG data URL so PDF building never crashes.
 */
export async function getLogoBase64(): Promise<string> {
  if (memoizedLogoBase64) return memoizedLogoBase64;
  try {
    const response = await fetch('/logo.png');
    if (!response.ok) throw new Error('Logo status not OK');
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        // Verify it looks like a valid image data URL
        if (base64data.startsWith('data:image/')) {
          memoizedLogoBase64 = base64data;
          resolve(base64data);
        } else {
          throw new Error('Invalid image data URL format');
        }
      };
      reader.onerror = () => {
        resolve(getFallbackPixel());
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn("Could not load logo as base64, falling back to dummy/empty pixel or placeholder:", error);
    return getFallbackPixel();
  }
}

function getFallbackPixel(): string {
  // A valid transparent 1x1 PNG data URL
  return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
}

/**
 * Inserts the UVCI logo into a jsPDF document asynchronously.
 * Prevents throwing "wrong PNG signature" errors by validating the mime-type.
 */
export async function addLogoToDoc(
  doc: any,
  x: number,
  y: number,
  w: number,
  h: number
): Promise<void> {
  try {
    const base64 = await getLogoBase64();
    // Default format to PNG or JPEG depending on base64 headers
    let format = 'PNG';
    if (base64.includes('image/jpeg') || base64.includes('image/jpg')) {
      format = 'JPEG';
    } else if (base64.includes('image/png')) {
      format = 'PNG';
    } else if (base64.includes('image/webp')) {
      format = 'WEBP';
    }
    
    doc.addImage(base64, format, x, y, w, h);
  } catch (e) {
    console.warn("Recoverable: Failed to add logo to jsPDF document gracefully:", e);
  }
}
