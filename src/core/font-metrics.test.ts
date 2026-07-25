import { describe, expect, it } from "vitest";
import type { Font } from "opentype.js";

import {
  extractFontMetrics,
  getFontSizeForWritingHeight,
} from "./font-metrics";

describe("worksheet font metrics", () => {
  const glyphTops: Readonly<Record<string, number>> = {
    b: 716,
    d: 715,
    f: 715,
    h: 716,
    k: 712,
    l: 708,
    t: 713,
    x: 468,
  };
  const font = {
    unitsPerEm: 1_000,
    ascender: 1_042,
    descender: -312,
    charToGlyph: (character: string) => ({
      getBoundingBox: () => ({
        x1: 0,
        y1: 0,
        x2: 400,
        y2: glyphTops[character] ?? 0,
      }),
    }),
  } as unknown as Font;

  it("uses visible tall-letter bounds instead of invisible ascender headroom", () => {
    const metrics = extractFontMetrics(font);

    expect(metrics.ascender).toBe(1_042);
    expect(metrics.tallLetterHeight).toBe(716);
    expect(metrics.xHeightRatio).toBeCloseTo(468 / 716);
    expect(metrics.descenderDepthRatio).toBeCloseTo(312 / 716);
  });

  it("scales tall letters to the selected writing height", () => {
    const metrics = extractFontMetrics(font);
    const fontSizeMm = getFontSizeForWritingHeight(6, metrics);
    const renderedTallLetterHeightMm =
      (metrics.tallLetterHeight / metrics.unitsPerEm) * fontSizeMm;

    expect(renderedTallLetterHeightMm).toBeCloseTo(6, 10);
  });
});
