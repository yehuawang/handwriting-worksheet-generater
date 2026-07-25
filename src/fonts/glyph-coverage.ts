import type { Font } from "opentype.js";

export interface MissingGlyph {
  readonly character: string;
  readonly codePoint: string;
}

export function findMissingGlyphs(
  text: string,
  font: Pick<Font, "charToGlyphIndex">,
): readonly MissingGlyph[] {
  const checkedCharacters = new Set<string>();
  const missingGlyphs: MissingGlyph[] = [];

  for (const character of text) {
    if (isIgnoredCharacter(character) || checkedCharacters.has(character)) {
      continue;
    }

    checkedCharacters.add(character);
    if (font.charToGlyphIndex(character) === 0) {
      const codePoint = character.codePointAt(0);
      missingGlyphs.push({
        character,
        codePoint: `U+${codePoint?.toString(16).toUpperCase().padStart(4, "0")}`,
      });
    }
  }

  return missingGlyphs;
}

function isIgnoredCharacter(character: string): boolean {
  return /\s/u.test(character) || character === "\uFE0F";
}
