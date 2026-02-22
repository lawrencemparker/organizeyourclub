/**
 * Converts a Hex color (#ffffff) to HSL format (0 0% 100%)
 * This is required because Shadcn/Tailwind uses HSL variables for opacity support.
 */
export function hexToHSL(hex: string): string {
  // Remove hash if present
  hex = hex.replace(/^#/, '');

  // Parse r, g, b
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);

  // Convert to 0-1 range
  r /= 255;
  g /= 255;
  b /= 255;

  // Calculate HSL
  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  // Return strictly the space-separated numbers: "220 10% 50%"
  // This format allows Tailwind to do 'bg-primary/20'
  return `${(h * 360).toFixed(1)} ${(s * 100).toFixed(1)}% ${(l * 100).toFixed(1)}%`;
}