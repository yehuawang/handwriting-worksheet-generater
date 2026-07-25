import type { Font } from "opentype.js";

export interface WorksheetFontMetrics {
  readonly unitsPerEm: number;
  readonly ascender: number;
  readonly descender: number;
  /**
   * Highest visible point among representative tall lowercase letters.
   * This excludes invisible headroom in the font's global ascender metric.
   */
  readonly tallLetterHeight: number;
  readonly xHeight: number;
  readonly xHeightRatio: number;
  readonly descenderDepthRatio: number;
}

const REPRESENTATIVE_TALL_LETTERS = "bdfhklt";

export function extractFontMetrics(font: Font): WorksheetFontMetrics {
  const { unitsPerEm, ascender, descender } = font;

  if (unitsPerEm <= 0 || ascender <= 0 || descender >= 0) {
    throw new Error("The font contains unsupported vertical metrics.");
  }

  const xGlyphBounds = font.charToGlyph("x").getBoundingBox();
  const measuredXHeight = xGlyphBounds.y2;
  const fallbackXHeight = ascender * 0.55;
  const xHeight =
    Number.isFinite(measuredXHeight) && measuredXHeight > 0
      ? measuredXHeight
      : fallbackXHeight;
  const measuredTallLetterHeight = Math.max(
    ...Array.from(
      REPRESENTATIVE_TALL_LETTERS,
      (character) => font.charToGlyph(character).getBoundingBox().y2,
    ),
  );
  const tallLetterHeight =
    Number.isFinite(measuredTallLetterHeight) && measuredTallLetterHeight > 0
      ? measuredTallLetterHeight
      : ascender;

  return {
    unitsPerEm,
    ascender,
    descender,
    tallLetterHeight,
    xHeight,
    xHeightRatio: clampRatio(xHeight / tallLetterHeight),
    descenderDepthRatio: clampRatio(Math.abs(descender) / tallLetterHeight),
  };
}

export function getFontSizeForWritingHeight(
  writingHeightMm: number,
  metrics: WorksheetFontMetrics,
): number {
  if (!Number.isFinite(writingHeightMm) || writingHeightMm <= 0) {
    throw new RangeError("writingHeightMm must be greater than zero.");
  }

  return (writingHeightMm * metrics.unitsPerEm) / metrics.tallLetterHeight;
}

function clampRatio(value: number): number {
  return Math.min(0.95, Math.max(0.05, value));
}
