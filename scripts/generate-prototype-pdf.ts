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
import type {
  BuiltInFontId,
  LoadedWorksheetFont,
} from "../src/fonts/worksheet-fonts";
import { createWorksheetPdfBytes } from "../src/renderers/pdf";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = resolve(projectRoot, "tmp/pdfs");
const sourceText = Array.from(
  { length: 28 },
  (_, index) =>
    `  Practice line ${index + 1}: Tall letters b d f h k l t, round letters a c e o, and descending letters g j p q y.`,
).join("\n");

await mkdir(outputDirectory, { recursive: true });

const fonts: readonly {
  id: BuiltInFontId;
  familyName: string;
  relativePath: string;
}[] = [
  {
    id: "patrick-hand",
    familyName: "Patrick Hand",
    relativePath: "public/fonts/patrick-hand/PatrickHand-Regular.ttf",
  },
  {
    id: "architects-daughter",
    familyName: "Architects Daughter",
    relativePath:
      "public/fonts/architects-daughter/ArchitectsDaughter-Regular.ttf",
  },
  {
    id: "gloria-hallelujah",
    familyName: "Gloria Hallelujah",
    relativePath: "public/fonts/gloria-hallelujah/GloriaHallelujah.ttf",
  },
];

for (const definition of fonts) {
  const fontBytes = await readFile(
    resolve(projectRoot, definition.relativePath),
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
  const worksheet = createWorksheetDocumentModel(sourceText, settings, (text) =>
    font.getAdvanceWidth(text, fontSizeMm),
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
