import { parse, type Font } from "opentype.js";

import {
  extractFontMetrics,
  type WorksheetFontMetrics,
} from "../core/font-metrics";

export const PATRICK_HAND_FONT_URL =
  "/fonts/patrick-hand/PatrickHand-Regular.ttf";

export interface LoadedWorksheetFont {
  readonly familyName: "Patrick Hand";
  readonly bytes: Uint8Array;
  readonly font: Font;
  readonly metrics: WorksheetFontMetrics;
}

let fontPromise: Promise<LoadedWorksheetFont> | undefined;

export function loadPatrickHandFont(): Promise<LoadedWorksheetFont> {
  fontPromise ??= fetch(PATRICK_HAND_FONT_URL)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Unable to load Patrick Hand (${response.status}).`);
      }

      const buffer = await response.arrayBuffer();
      const font = parse(buffer.slice(0));

      return {
        familyName: "Patrick Hand",
        bytes: new Uint8Array(buffer),
        font,
        metrics: extractFontMetrics(font),
      } satisfies LoadedWorksheetFont;
    })
    .catch((error: unknown) => {
      fontPromise = undefined;
      throw error;
    });

  return fontPromise;
}
