// src/colors/interpolateColor.test.ts

import { describe, it, expect } from "vitest"
import { interpolateColor, hexToColor, colorToRgbString, type Color } from "./interpolateColor"

describe("interpolateColor", () => {
  const start: Color = { r: 250, g: 248, b: 243 } // --color-bg
  const end: Color = { r: 47, g: 158, b: 86 }      // --color-accent

  it("returns startColor exactly at fraction 0", () => {
    expect(interpolateColor(start, end, 0)).toEqual(start)
  })

  it("returns endColor exactly at fraction 1", () => {
    expect(interpolateColor(start, end, 1)).toEqual(end)
  })

  it("returns the midpoint at fraction 0.5", () => {
    // (250+47)/2 = 148.5 -> rounds to 149 or 148 depending on rounding
    // convention; assert against the actual lerp+round formula, not a
    // hand-picked number, so this doesn't silently drift if rounding changes.
    const expected: Color = {
      r: Math.round(start.r + (end.r - start.r) * 0.5),
      g: Math.round(start.g + (end.g - start.g) * 0.5),
      b: Math.round(start.b + (end.b - start.b) * 0.5),
    }
    expect(interpolateColor(start, end, 0.5)).toEqual(expected)
  })

  it("clamps fractions above 1 to endColor", () => {
    expect(interpolateColor(start, end, 2.3)).toEqual(end)
  })

  it("clamps fractions below 0 to startColor", () => {
    expect(interpolateColor(start, end, -5)).toEqual(start)
  })

  it("interpolates each channel independently", () => {
    const a: Color = { r: 0, g: 0, b: 0 }
    const b: Color = { r: 100, g: 200, b: 50 }
    expect(interpolateColor(a, b, 0.25)).toEqual({ r: 25, g: 50, b: 13 })
  })
})

describe("hexToColor", () => {
  it("parses a lowercase hex string with #", () => {
    expect(hexToColor("#c1443c")).toEqual({ r: 193, g: 68, b: 60 })
  })

  it("parses a hex string without a leading #", () => {
    expect(hexToColor("2f9e56")).toEqual({ r: 47, g: 158, b: 86 })
  })

  it("handles pure black and pure white", () => {
    expect(hexToColor("#000000")).toEqual({ r: 0, g: 0, b: 0 })
    expect(hexToColor("#ffffff")).toEqual({ r: 255, g: 255, b: 255 })
  })

  it("trims surrounding whitespace, as returned by getComputedStyle", () => {
    expect(hexToColor("  #faf8f3 ")).toEqual({ r: 250, g: 248, b: 243 })
  })
})

describe("colorToRgbString", () => {
  it("formats a Color as an rgb() string", () => {
    expect(colorToRgbString({ r: 193, g: 68, b: 60 })).toBe("rgb(193, 68, 60)")
  })
})
