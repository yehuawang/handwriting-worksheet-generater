import { describe, expect, it } from "vitest";

import {
  expandTabs,
  getSourceLines,
  normalizePlainText,
  wrapTextLine,
} from "./text";

describe("plain-text normalization", () => {
  it("normalizes a BOM and Windows line endings", () => {
    expect(normalizePlainText("\uFEFFfirst\r\n  second\rthird")).toBe(
      "first\n  second\nthird",
    );
  });

  it("expands tabs to tab stops rather than a fixed replacement", () => {
    expect(expandTabs("\tA\tB", 4)).toBe("    A   B");
  });

  it("preserves blank lines and indentation", () => {
    expect(getSourceLines("  first\n\n\tsecond")).toEqual([
      "  first",
      "",
      "    second",
    ]);
  });
});

describe("line wrapping", () => {
  const measureText = (text: string) => text.length;

  it("leaves a fitting line unchanged", () => {
    expect(wrapTextLine("Short line", 20, measureText)).toEqual([
      { text: "Short line", continuationIndex: 0 },
    ]);
  });

  it("preserves indentation on wrapped continuations", () => {
    expect(wrapTextLine("  alpha beta gamma", 10, measureText)).toEqual([
      { text: "  alpha", continuationIndex: 0 },
      { text: "  beta", continuationIndex: 1 },
      { text: "  gamma", continuationIndex: 2 },
    ]);
  });

  it("breaks a word when no whitespace fits", () => {
    expect(wrapTextLine("abcdefgh", 3, measureText)).toEqual([
      { text: "abc", continuationIndex: 0 },
      { text: "def", continuationIndex: 1 },
      { text: "gh", continuationIndex: 2 },
    ]);
  });
});
