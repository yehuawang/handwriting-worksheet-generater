import { parse, type Font } from "opentype.js";

import {
  extractFontMetrics,
  type WorksheetFontMetrics,
} from "../core/font-metrics";

export type BuiltInFontId =
  "patrick-hand" | "architects-daughter" | "gloria-hallelujah";

export interface BuiltInFontDefinition {
  readonly id: BuiltInFontId;
  readonly familyName: string;
  readonly url: string;
  readonly attribution: string;
}

export interface LoadedWorksheetFont {
  readonly id: BuiltInFontId;
  readonly familyName: string;
  readonly bytes: Uint8Array;
  readonly font: Font;
  readonly metrics: WorksheetFontMetrics;
}

export const BUILT_IN_FONTS: readonly BuiltInFontDefinition[] = [
  {
    id: "patrick-hand",
    familyName: "Patrick Hand",
    url: "/fonts/patrick-hand/PatrickHand-Regular.ttf",
    attribution: "Patrick Wagesreiter",
  },
  {
    id: "architects-daughter",
    familyName: "Architects Daughter",
    url: "/fonts/architects-daughter/ArchitectsDaughter-Regular.ttf",
    attribution: "Kimberly Geswein",
  },
  {
    id: "gloria-hallelujah",
    familyName: "Gloria Hallelujah",
    url: "/fonts/gloria-hallelujah/GloriaHallelujah.ttf",
    attribution: "Kimberly Geswein",
  },
];

const fontPromises = new Map<BuiltInFontId, Promise<LoadedWorksheetFont>>();

export function loadBuiltInFont(
  fontId: BuiltInFontId,
): Promise<LoadedWorksheetFont> {
  const definition = BUILT_IN_FONTS.find(({ id }) => id === fontId);
  if (!definition) {
    return Promise.reject(new Error(`Unknown built-in font: ${fontId}`));
  }

  const existingPromise = fontPromises.get(fontId);
  if (existingPromise) {
    return existingPromise;
  }

  const fontPromise = fetch(definition.url)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(
          `Unable to load ${definition.familyName} (${response.status}).`,
        );
      }

      const buffer = await response.arrayBuffer();
      const font = parse(buffer.slice(0));

      return {
        id: definition.id,
        familyName: definition.familyName,
        bytes: new Uint8Array(buffer),
        font,
        metrics: extractFontMetrics(font),
      };
    })
    .catch((error: unknown) => {
      fontPromises.delete(fontId);
      throw error;
    });

  fontPromises.set(fontId, fontPromise);
  return fontPromise;
}
