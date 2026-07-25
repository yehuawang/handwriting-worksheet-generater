import { describe, expect, it } from "vitest";

import { expandTabs, getSourceLines, normalizePlainText } from "./text";

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
