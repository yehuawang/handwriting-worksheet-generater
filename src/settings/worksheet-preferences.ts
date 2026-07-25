import { DEFAULT_WORKSHEET_SETTINGS, type WorksheetSettings } from "../core";

export const WORKSHEET_PREFERENCES_STORAGE_KEY =
  "handwriting-worksheet-generator.preferences";

export interface WorksheetConfiguration {
  readonly settings: WorksheetSettings;
  readonly textColor: string;
  readonly showCalibration: boolean;
  readonly builtInFontId: string;
  readonly textAssetId?: string;
  readonly customFontAssetId?: string;
}

export interface WorksheetPreset extends WorksheetConfiguration {
  readonly id: string;
  readonly name: string;
  readonly updatedAt: string;
}

export interface WorksheetPreferences {
  readonly version: 1;
  readonly recent: WorksheetConfiguration;
  readonly presets: readonly WorksheetPreset[];
}

export const DEFAULT_WORKSHEET_CONFIGURATION: WorksheetConfiguration = {
  settings: DEFAULT_WORKSHEET_SETTINGS,
  textColor: "#475569",
  showCalibration: true,
  builtInFontId: "patrick-hand",
};

export function loadWorksheetPreferences(
  storage: Pick<Storage, "getItem"> | null = getLocalStorage(),
): WorksheetPreferences {
  if (!storage) {
    return createDefaultPreferences();
  }

  try {
    const raw = storage.getItem(WORKSHEET_PREFERENCES_STORAGE_KEY);
    if (!raw) {
      return createDefaultPreferences();
    }

    const value: unknown = JSON.parse(raw);
    return isWorksheetPreferences(value) ? value : createDefaultPreferences();
  } catch {
    return createDefaultPreferences();
  }
}

export function saveWorksheetPreferences(
  preferences: WorksheetPreferences,
  storage: Pick<Storage, "setItem"> | null = getLocalStorage(),
): boolean {
  if (!storage) {
    return false;
  }

  try {
    storage.setItem(
      WORKSHEET_PREFERENCES_STORAGE_KEY,
      JSON.stringify(preferences),
    );
    return true;
  } catch {
    return false;
  }
}

export function createPreset(
  name: string,
  configuration: WorksheetConfiguration,
  id = createPresetId(),
  updatedAt = new Date().toISOString(),
): WorksheetPreset {
  const normalizedName = name.trim();
  if (!normalizedName) {
    throw new Error("Preset name cannot be empty.");
  }

  return { ...configuration, id, name: normalizedName, updatedAt };
}

export function upsertPreset(
  presets: readonly WorksheetPreset[],
  preset: WorksheetPreset,
): readonly WorksheetPreset[] {
  const withoutMatchingPreset = presets.filter(
    ({ id, name }) =>
      id !== preset.id &&
      name.toLocaleLowerCase() !== preset.name.toLocaleLowerCase(),
  );
  return [...withoutMatchingPreset, preset].sort((left, right) =>
    left.name.localeCompare(right.name),
  );
}

function createDefaultPreferences(): WorksheetPreferences {
  return {
    version: 1,
    recent: DEFAULT_WORKSHEET_CONFIGURATION,
    presets: [],
  };
}

function getLocalStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function createPresetId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `preset-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isWorksheetPreferences(value: unknown): value is WorksheetPreferences {
  if (!isRecord(value) || value.version !== 1) {
    return false;
  }
  return (
    isWorksheetConfiguration(value.recent) &&
    Array.isArray(value.presets) &&
    value.presets.every(isWorksheetPreset)
  );
}

function isWorksheetPreset(value: unknown): value is WorksheetPreset {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    value.name.trim().length > 0 &&
    typeof value.updatedAt === "string" &&
    isWorksheetConfiguration(value)
  );
}

function isWorksheetConfiguration(
  value: unknown,
): value is WorksheetConfiguration {
  return (
    isRecord(value) &&
    isWorksheetSettings(value.settings) &&
    typeof value.textColor === "string" &&
    /^#[0-9a-f]{6}$/i.test(value.textColor) &&
    typeof value.showCalibration === "boolean" &&
    typeof value.builtInFontId === "string" &&
    isOptionalString(value.textAssetId) &&
    isOptionalString(value.customFontAssetId)
  );
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === "string";
}

function isWorksheetSettings(value: unknown): value is WorksheetSettings {
  if (
    !isRecord(value) ||
    !isRecord(value.pageLabels) ||
    !isRecord(value.guidelines)
  ) {
    return false;
  }

  const labels = value.pageLabels;
  const guidelines = value.guidelines;
  return (
    (value.paper === "letter" || value.paper === "a4") &&
    (value.orientation === "portrait" || value.orientation === "landscape") &&
    isNumberInRange(value.marginMm, 5, 30) &&
    isNumberInRange(value.tabWidth, 1, 8) &&
    (value.practiceRows === 0 || value.practiceRows === 1) &&
    typeof labels.showHeader === "boolean" &&
    typeof labels.headerLeft === "string" &&
    typeof labels.headerRight === "string" &&
    isNumberInRange(labels.headerFontSizeMm, 2, 8) &&
    typeof labels.showFooter === "boolean" &&
    typeof labels.footerCenter === "string" &&
    isNumberInRange(labels.footerFontSizeMm, 2, 8) &&
    isNumberInRange(guidelines.writingHeightMm, 4, 12) &&
    isNumberInRange(guidelines.xHeightRatio, 0.1, 1) &&
    isNumberInRange(guidelines.descenderDepthRatio, 0, 1) &&
    isNumberInRange(guidelines.rowGapMm, 0, 12) &&
    ["none", "baseline", "three-line", "four-line"].includes(
      String(guidelines.mode),
    )
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNumberInRange(value: unknown, minimum: number, maximum: number) {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= minimum &&
    value <= maximum
  );
}
