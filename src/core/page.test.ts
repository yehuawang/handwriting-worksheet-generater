import { describe, expect, it } from "vitest";

import { getOrientedPageSize } from "./page";

describe("page sizes", () => {
  it("returns US Letter dimensions in portrait orientation", () => {
    const page = getOrientedPageSize("letter", "portrait");

    expect(page.widthMm).toBeCloseTo(215.9);
    expect(page.heightMm).toBeCloseTo(279.4);
  });

  it("swaps A4 dimensions in landscape orientation", () => {
    expect(getOrientedPageSize("a4", "landscape")).toEqual({
      widthMm: 297,
      heightMm: 210,
    });
  });
});
