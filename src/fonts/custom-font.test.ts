import { describe, expect, it } from "vitest";

import { MAX_CUSTOM_FONT_BYTES, validateCustomFontFile } from "./custom-font";

describe("custom font validation", () => {
  it("accepts TTF and OTF filenames case-insensitively", () => {
    expect(() => validateCustomFontFile("Practice.TTF", 1024)).not.toThrow();
    expect(() => validateCustomFontFile("Practice.otf", 1024)).not.toThrow();
  });

  it("rejects unsupported, empty, and oversized files", () => {
    expect(() => validateCustomFontFile("Practice.woff2", 1024)).toThrow(
      ".ttf or .otf",
    );
    expect(() => validateCustomFontFile("Practice.ttf", 0)).toThrow("empty");
    expect(() =>
      validateCustomFontFile("Practice.ttf", MAX_CUSTOM_FONT_BYTES + 1),
    ).toThrow("10 MB");
  });
});
