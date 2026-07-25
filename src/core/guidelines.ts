export type GuidelineMode = "baseline" | "three-line" | "four-line";
export type GuidelineKind = "ascender" | "x-height" | "baseline" | "descender";

export interface GuidelineSettings {
  /**
   * Distance from the ascender line to the baseline, in millimetres.
   */
  readonly writingHeightMm: number;
  /**
   * Lowercase body height divided by writing height.
   */
  readonly xHeightRatio: number;
  /**
   * Descender depth divided by writing height.
   */
  readonly descenderDepthRatio: number;
  /**
   * Gap from one row's descender line to the next row's ascender line.
   */
  readonly rowGapMm: number;
  readonly mode: GuidelineMode;
}

export interface Guideline {
  readonly kind: GuidelineKind;
  /**
   * Vertical position relative to the row's ascender line, in millimetres.
   */
  readonly yMm: number;
}

export interface GuidelineGeometry {
  readonly guidelines: readonly Guideline[];
  readonly writingHeightMm: number;
  readonly descenderDepthMm: number;
  readonly rowHeightMm: number;
  readonly rowPitchMm: number;
}

export const DEFAULT_GUIDELINE_SETTINGS: GuidelineSettings = {
  writingHeightMm: 6,
  xHeightRatio: 0.55,
  descenderDepthRatio: 0.35,
  rowGapMm: 2,
  mode: "four-line",
};

export function createGuidelineGeometry(
  settings: GuidelineSettings,
): GuidelineGeometry {
  validateSettings(settings);

  const { writingHeightMm, xHeightRatio, descenderDepthRatio, rowGapMm } =
    settings;
  const baselineY = writingHeightMm;
  const xHeightY = baselineY - writingHeightMm * xHeightRatio;
  const descenderDepthMm = writingHeightMm * descenderDepthRatio;
  const descenderY = baselineY + descenderDepthMm;

  const allGuidelines: Readonly<Record<GuidelineKind, Guideline>> = {
    ascender: { kind: "ascender", yMm: 0 },
    "x-height": { kind: "x-height", yMm: xHeightY },
    baseline: { kind: "baseline", yMm: baselineY },
    descender: { kind: "descender", yMm: descenderY },
  };

  const guidelineKinds = getGuidelineKinds(settings.mode);
  const rowHeightMm = descenderY;

  return {
    guidelines: guidelineKinds.map((kind) => allGuidelines[kind]),
    writingHeightMm,
    descenderDepthMm,
    rowHeightMm,
    rowPitchMm: rowHeightMm + rowGapMm,
  };
}

function getGuidelineKinds(mode: GuidelineMode): readonly GuidelineKind[] {
  switch (mode) {
    case "baseline":
      return ["baseline"];
    case "three-line":
      return ["ascender", "x-height", "baseline"];
    case "four-line":
      return ["ascender", "x-height", "baseline", "descender"];
  }
}

function validateSettings(settings: GuidelineSettings): void {
  assertPositive(settings.writingHeightMm, "writingHeightMm");
  assertRatio(settings.xHeightRatio, "xHeightRatio");
  assertRatio(settings.descenderDepthRatio, "descenderDepthRatio");

  if (!Number.isFinite(settings.rowGapMm) || settings.rowGapMm < 0) {
    throw new RangeError(
      "rowGapMm must be a finite number greater than or equal to zero.",
    );
  }
}

function assertPositive(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a finite number greater than zero.`);
  }
}

function assertRatio(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0 || value >= 1) {
    throw new RangeError(
      `${name} must be greater than zero and less than one.`,
    );
  }
}
