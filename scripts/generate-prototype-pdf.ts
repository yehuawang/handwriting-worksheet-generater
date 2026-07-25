import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import opentype from "opentype.js";

import {
  createWorksheetDocumentModel,
  DEFAULT_WORKSHEET_SETTINGS,
  extractFontMetrics,
  getFontSizeForWritingHeight,
} from "../src/core";
import { BUILT_IN_FONTS } from "../src/fonts/font-definitions";
import type { LoadedWorksheetFont } from "../src/fonts/worksheet-fonts";
import { createWorksheetPdfBytes } from "../src/renderers/pdf";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = resolve(projectRoot, "tmp/pdfs");
const sourceText = Array.from(
  { length: 28 },
  (_, index) =>
    `  Practice line ${index + 1}: Tall letters b d f h k l t, round letters a c e o, and descending letters g j p q y.`,
).join("\n");

await mkdir(outputDirectory, { recursive: true });

for (const definition of BUILT_IN_FONTS) {
  const fontBytes = await readFile(
    resolve(projectRoot, `public${definition.url}`),
  );
  const buffer = fontBytes.buffer.slice(
    fontBytes.byteOffset,
    fontBytes.byteOffset + fontBytes.byteLength,
  );
  const font = opentype.parse(buffer);
  const metrics = extractFontMetrics(font);
  const worksheetFont: LoadedWorksheetFont = {
    id: definition.id,
    familyName: definition.familyName,
    cssFamilyName: definition.familyName,
    source: "built-in",
    bytes: new Uint8Array(fontBytes),
    font,
    metrics,
  };
  const settings = {
    ...DEFAULT_WORKSHEET_SETTINGS,
    pageLabels: {
      ...DEFAULT_WORKSHEET_SETTINGS.pageLabels,
      headerFontSizeMm: 5,
      footerFontSizeMm: 4,
    },
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
  const worksheet = createWorksheetDocumentModel(
    sourceText,
    settings,
    (text) => worksheetFont.font.getAdvanceWidth(text, fontSizeMm),
    { fileName: "handwriting-practice.txt" },
  );
  const pdfBytes = await createWorksheetPdfBytes({
    worksheet,
    worksheetFont,
    fontSizeMm,
    textColor: "#475569",
    showCalibration: true,
  });
  const outputPath = resolve(
    outputDirectory,
    `printable-prototype-${definition.id}.pdf`,
  );

  await writeFile(outputPath, pdfBytes);
  console.log(outputPath);
}
