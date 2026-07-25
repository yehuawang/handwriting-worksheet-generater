import { describe, expect, it } from "vitest";

import {
  createPreset,
  DEFAULT_WORKSHEET_CONFIGURATION,
  loadWorksheetPreferences,
  saveWorksheetPreferences,
  upsertPreset,
  WORKSHEET_PREFERENCES_STORAGE_KEY,
} from "./worksheet-preferences";

function createMemoryStorage(initialValue: string | null = null) {
  let value = initialValue;
  return {
    getItem: (key: string) =>
      key === WORKSHEET_PREFERENCES_STORAGE_KEY ? value : null,
    setItem: (key: string, nextValue: string) => {
      if (key === WORKSHEET_PREFERENCES_STORAGE_KEY) {
        value = nextValue;
      }
    },
  };
}

describe("worksheet preferences", () => {
  it("falls back safely when stored preferences are invalid", () => {
    const storage = createMemoryStorage('{"version":99}');
    expect(loadWorksheetPreferences(storage)).toMatchObject({
      version: 1,
      recent: DEFAULT_WORKSHEET_CONFIGURATION,
      presets: [],
    });
  });

  it("round-trips recent settings and named presets", () => {
    const storage = createMemoryStorage();
    const preset = createPreset(
      "Daily practice",
      {
        ...DEFAULT_WORKSHEET_CONFIGURATION,
        textAssetId: "preset:preset-1:text",
        customFontAssetId: "preset:preset-1:font",
      },
      "preset-1",
      "2026-07-25T00:00:00.000Z",
    );
    const preferences = {
      version: 1 as const,
      recent: DEFAULT_WORKSHEET_CONFIGURATION,
      presets: [preset],
    };

    expect(saveWorksheetPreferences(preferences, storage)).toBe(true);
    expect(loadWorksheetPreferences(storage)).toEqual(preferences);
  });

  it("replaces a preset with the same case-insensitive name", () => {
    const first = createPreset(
      "Classroom",
      DEFAULT_WORKSHEET_CONFIGURATION,
      "first",
    );
    const replacement = createPreset(
      "classroom",
      { ...DEFAULT_WORKSHEET_CONFIGURATION, textColor: "#000000" },
      "replacement",
    );

    expect(upsertPreset([first], replacement)).toEqual([replacement]);
  });
});
