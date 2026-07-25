import { parse, type Font } from "opentype.js";

import {
  extractFontMetrics,
  type WorksheetFontMetrics,
} from "../core/font-metrics";
import { BUILT_IN_FONTS, type BuiltInFontId } from "./font-definitions";

export * from "./font-definitions";

export interface LoadedWorksheetFont {
  readonly id: string;
  readonly familyName: string;
  readonly cssFamilyName: string;
  readonly source: "built-in" | "custom";
  readonly bytes: Uint8Array;
  readonly font: Font;
  readonly metrics: WorksheetFontMetrics;
}

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
        cssFamilyName: definition.familyName,
        source: "built-in",
        bytes: new Uint8Array(buffer),
        font,
        metrics: extractFontMetrics(font),
      } satisfies LoadedWorksheetFont;
    })
    .catch((error: unknown) => {
      fontPromises.delete(fontId);
      throw error;
    });

  fontPromises.set(fontId, fontPromise);
  return fontPromise;
}

export function isBuiltInFontId(fontId: string): fontId is BuiltInFontId {
  return BUILT_IN_FONTS.some(({ id }) => id === fontId);
}
