import { describe, expect, it } from "vitest";

import {
  createGuidelineGeometry,
  DEFAULT_GUIDELINE_SETTINGS,
  type GuidelineSettings,
} from "./guidelines";

describe("guideline geometry", () => {
  it("creates the default four-line geometry in millimetres", () => {
    const geometry = createGuidelineGeometry(DEFAULT_GUIDELINE_SETTINGS);

    expect(geometry.guidelines).toEqual([
      { kind: "ascender", yMm: 0 },
      { kind: "x-height", yMm: 2.6999999999999997 },
      { kind: "baseline", yMm: 6 },
      { kind: "descender", yMm: 8.1 },
    ]);
    expect(geometry.rowHeightMm).toBeCloseTo(8.1);
    expect(geometry.rowPitchMm).toBeCloseTo(10.1);
  });

  it("returns only the baseline in baseline mode", () => {
    const settings: GuidelineSettings = {
      ...DEFAULT_GUIDELINE_SETTINGS,
      mode: "baseline",
    };

    expect(createGuidelineGeometry(settings).guidelines).toEqual([
      { kind: "baseline", yMm: 6 },
    ]);
  });

  it("omits the descender line in three-line mode", () => {
    const settings: GuidelineSettings = {
      ...DEFAULT_GUIDELINE_SETTINGS,
      mode: "three-line",
    };

    expect(
      createGuidelineGeometry(settings).guidelines.map(({ kind }) => kind),
    ).toEqual(["ascender", "x-height", "baseline"]);
  });

  it("rejects invalid physical dimensions and ratios", () => {
    expect(() =>
      createGuidelineGeometry({
        ...DEFAULT_GUIDELINE_SETTINGS,
        writingHeightMm: 0,
      }),
    ).toThrow(RangeError);

    expect(() =>
      createGuidelineGeometry({
        ...DEFAULT_GUIDELINE_SETTINGS,
        xHeightRatio: 1,
      }),
    ).toThrow(RangeError);
  });
});
