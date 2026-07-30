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

/** Cached result so we only fetch once per session */
let _cachedLogoBase64: string | null = null;

/**
 * Returns the logo as a base64 data URL.
 * Fetches from /logo.png on first call, then returns the cached value.
 * Returns an empty string if the fetch fails (PDF will render without logo).
 */
export async function getLogoBase64(): Promise<string> {
  if (_cachedLogoBase64 !== null) return _cachedLogoBase64;

  try {
    const response = await fetch("/logo.png");
    if (!response.ok) throw new Error(`Logo fetch failed: ${response.status}`);
    const blob = await response.blob();
    _cachedLogoBase64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    // Silently fall back — PDF will render a placeholder box instead
    _cachedLogoBase64 = "";
  }

  return _cachedLogoBase64;
}

/**
 * @deprecated Use getLogoBase64() instead.
 * Kept for backwards compatibility — returns an empty string synchronously.
 * The logo is now fetched lazily to avoid embedding 169KB in the JS bundle.
 */
export const LOGO_BASE64 = "";
