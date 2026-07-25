import { describe, expect, it } from "vitest";

import { getPresetFontAssetId, getPresetTextAssetId } from "./local-assets";

describe("local preset asset identifiers", () => {
  it("keeps text and font assets isolated by preset", () => {
    expect(getPresetTextAssetId("daily")).toBe("preset:daily:text");
    expect(getPresetFontAssetId("daily")).toBe("preset:daily:font");
    expect(getPresetTextAssetId("daily")).not.toBe(
      getPresetFontAssetId("daily"),
    );
  });
});
