import { describe, expect, it } from "vitest";

import { BUILT_IN_FONTS } from "./worksheet-fonts";

describe("built-in worksheet fonts", () => {
  it("provides unique identifiers, names, and local asset URLs", () => {
    expect(BUILT_IN_FONTS).toHaveLength(33);
    expect(new Set(BUILT_IN_FONTS.map(({ id }) => id)).size).toBe(
      BUILT_IN_FONTS.length,
    );
    expect(
      new Set(BUILT_IN_FONTS.map(({ familyName }) => familyName)).size,
    ).toBe(BUILT_IN_FONTS.length);

    for (const definition of BUILT_IN_FONTS) {
      expect(definition.url).toMatch(/^\/fonts\/.+\.ttf$/);
      expect(definition.attribution.length).toBeGreaterThan(0);
    }
  });
});
