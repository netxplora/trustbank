/**
 * logoBase64.ts
 *
 * Provides the brand logo as a base64 data URL for jsPDF.
 *
 * Previously this file stored the full base64 string (~169KB) which was
 * bundled into every JS chunk that imported documentEngine.ts.
 *
 * Now the logo is stored as a regular PNG asset in /logo.png and
 * fetched at runtime — only when PDF generation is triggered.
 * This removes ~170KB from the initial JS bundle.
 */

/** Cached result so we only fetch once per session per URL */
const _logoCache = new Map<string, string>();

/**
 * Returns the logo as a base64 data URL.
 * Fetches from the provided URL or falls back to /logo.png.
 * Returns an empty string if the fetch fails (PDF will render without logo).
 */
export async function getLogoBase64(url?: string): Promise<string> {
  const targetUrl = url || "/logo.png";
  
  if (_logoCache.has(targetUrl)) {
    return _logoCache.get(targetUrl)!;
  }

  try {
    const response = await fetch(targetUrl);
    if (!response.ok) throw new Error(`Logo fetch failed: ${response.status}`);
    const blob = await response.blob();
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
    _logoCache.set(targetUrl, base64);
    return base64;
  } catch {
    // Silently fall back — PDF will render a placeholder box instead
    _logoCache.set(targetUrl, "");
    return "";
  }
}

/**
 * @deprecated Use getLogoBase64() instead.
 * Kept for backwards compatibility — returns an empty string synchronously.
 * The logo is now fetched lazily to avoid embedding 169KB in the JS bundle.
 */
export const LOGO_BASE64 = "";
