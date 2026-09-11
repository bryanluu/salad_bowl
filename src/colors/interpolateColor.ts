// src/colors/interpolateColor.ts
export type Color = { r: number; g: number; b: number }

function lerp(a: number, b: number, fraction: number): number {
  return Math.round(a + (b - a) * fraction)
}

/**
 * Linearly interpolates between two RGB colors.
 * @param fraction - 0 returns startColor, 1 returns endColor. Values outside
 *   [0, 1] are clamped rather than extrapolated, since overshooting past the
 *   target color is rarely the intended visual result.
 */
export function interpolateColor(startColor: Color, endColor: Color, fraction: number): Color {
  const t = Math.min(Math.max(fraction, 0), 1)

  return {
    r: lerp(startColor.r, endColor.r, t),
    g: lerp(startColor.g, endColor.g, t),
    b: lerp(startColor.b, endColor.b, t),
  }
}

export function colorToRgbString({ r, g, b }: Color): string {
  return `rgb(${r}, ${g}, ${b})`
}

export function hexToColor(hex: string): Color {
  const clean = hex.trim().replace(/^#/, '')
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  }
}
