import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import opentype from "opentype.js";

import {
  createWorksheetPageModel,
  DEFAULT_WORKSHEET_SETTINGS,
  extractFontMetrics,
  getFontSizeForWritingHeight,
} from "../src/core";
import type { LoadedWorksheetFont } from "../src/fonts/patrick-hand";
import { createWorksheetPdfBytes } from "../src/renderers/pdf";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fontPath = resolve(
  projectRoot,
  "public/fonts/patrick-hand/PatrickHand-Regular.ttf",
);
const outputDirectory = resolve(projectRoot, "tmp/pdfs");
const outputPath = resolve(outputDirectory, "printable-prototype.pdf");
const sourceText = `Handwriting practice
  Indented words stay indented.

Tall letters reach the top: b d f h k l t
Round letters sit in the middle: a c e o
Descending letters reach below: g j p q y`;

const fontBytes = await readFile(fontPath);
const buffer = fontBytes.buffer.slice(
  fontBytes.byteOffset,
  fontBytes.byteOffset + fontBytes.byteLength,
);
const font = opentype.parse(buffer);
const metrics = extractFontMetrics(font);
const worksheetFont: LoadedWorksheetFont = {
  familyName: "Patrick Hand",
  bytes: new Uint8Array(fontBytes),
  font,
  metrics,
};
const settings = {
  ...DEFAULT_WORKSHEET_SETTINGS,
  guidelines: {
    ...DEFAULT_WORKSHEET_SETTINGS.guidelines,
    xHeightRatio: metrics.xHeightRatio,
    descenderDepthRatio: metrics.descenderDepthRatio,
  },
};
const fontSizeMm = getFontSizeForWritingHeight(
  settings.guidelines.writingHeightMm,
  metrics,
);
const model = createWorksheetPageModel(sourceText, settings, (text) =>
  font.getAdvanceWidth(text, fontSizeMm),
);
const pdfBytes = await createWorksheetPdfBytes({
  model,
  worksheetFont,
  fontSizeMm,
  textColor: "#475569",
  showCalibration: true,
});

await mkdir(outputDirectory, { recursive: true });
await writeFile(outputPath, pdfBytes);

console.log(outputPath);
