import { describe, expect, it } from "vitest";

import {
  inchesToMillimetres,
  millimetresToPoints,
  pointsToMillimetres,
} from "./units";

describe("physical-unit conversions", () => {
  it("converts one inch to 25.4 millimetres", () => {
    expect(inchesToMillimetres(1)).toBe(25.4);
  });

  it("converts one inch in millimetres to 72 PDF points", () => {
    expect(millimetresToPoints(25.4)).toBeCloseTo(72, 10);
  });

  it("round-trips between millimetres and PDF points", () => {
    const originalMillimetres = 6;

    expect(
      pointsToMillimetres(millimetresToPoints(originalMillimetres)),
    ).toBeCloseTo(originalMillimetres, 10);
  });

  it("rejects non-finite values", () => {
    expect(() => millimetresToPoints(Number.NaN)).toThrow(RangeError);
  });
});
