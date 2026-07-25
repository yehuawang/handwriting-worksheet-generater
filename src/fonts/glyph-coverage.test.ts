import { describe, expect, it } from "vitest";

import { findMissingGlyphs } from "./glyph-coverage";

describe("font glyph coverage", () => {
  it("reports each unsupported character once with its Unicode code point", () => {
    const missingGlyphs = findMissingGlyphs("ABC 字字 😀", {
      charToGlyphIndex: (character) =>
        character === "字" || character === "😀" ? 0 : 1,
    });

    expect(missingGlyphs).toEqual([
      { character: "字", codePoint: "U+5B57" },
      { character: "😀", codePoint: "U+1F600" },
    ]);
  });

  it("ignores whitespace and variation selectors", () => {
    expect(
      findMissingGlyphs(" \n\t\uFE0F", {
        charToGlyphIndex: () => 0,
      }),
    ).toEqual([]);
  });
});
