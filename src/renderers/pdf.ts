import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";

import { millimetresToPoints } from "../core/units";
import type { WorksheetDocumentModel } from "../core/worksheet";
import type { LoadedWorksheetFont } from "../fonts/worksheet-fonts";

interface ExportWorksheetPdfOptions {
  readonly worksheet: WorksheetDocumentModel;
  readonly worksheetFont: LoadedWorksheetFont;
  readonly fontSizeMm: number;
  readonly textColor: string;
  readonly fileName: string;
  readonly showCalibration: boolean;
}

export type CreateWorksheetPdfOptions = Omit<
  ExportWorksheetPdfOptions,
  "fileName"
>;

const LINE_COLORS = {
  ascender: "#b7c7d8",
  "x-height": "#a9bdd2",
  baseline: "#7892ad",
  descender: "#b7c7d8",
} as const;

export async function createWorksheetPdfBytes({
  worksheet,
  worksheetFont,
  fontSizeMm,
  textColor,
  showCalibration,
}: CreateWorksheetPdfOptions): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);

  const embeddedFont = await pdf.embedFont(worksheetFont.bytes, {
    subset: true,
  });
  for (const model of worksheet.pages) {
    const pageWidthPoints = millimetresToPoints(model.pageSize.widthMm);
    const pageHeightPoints = millimetresToPoints(model.pageSize.heightMm);
    const page = pdf.addPage([pageWidthPoints, pageHeightPoints]);
    const contentLeftMm = (model.pageSize.widthMm - model.contentWidthMm) / 2;
    const contentRightMm = contentLeftMm + model.contentWidthMm;

    for (const row of model.rows) {
      for (const guideline of model.guidelineGeometry.guidelines) {
        const yMm = row.topYmm + guideline.yMm;
        const color = hexToRgb(LINE_COLORS[guideline.kind]);

        page.drawLine({
          start: {
            x: millimetresToPoints(contentLeftMm),
            y: pageHeightPoints - millimetresToPoints(yMm),
          },
          end: {
            x: millimetresToPoints(contentRightMm),
            y: pageHeightPoints - millimetresToPoints(yMm),
          },
          thickness: 0.5,
          color,
          opacity: 0.9,
          ...(guideline.kind === "x-height"
            ? { dashArray: [4, 4], dashPhase: 0 }
            : {}),
        });
      }

      if (row.kind === "example" && row.text.length > 0) {
        page.drawText(row.text, {
          x: millimetresToPoints(contentLeftMm),
          y: pageHeightPoints - millimetresToPoints(row.baselineYmm),
          size: millimetresToPoints(fontSizeMm),
          font: embeddedFont,
          color: hexToRgb(textColor),
        });
      }
    }

    if (showCalibration) {
      drawCalibrationMark(
        page,
        pageHeightPoints,
        contentLeftMm,
        model.pageSize.heightMm,
        embeddedFont,
      );
    }
  }

  return pdf.save();
}

export async function exportWorksheetPdf({
  fileName,
  ...options
}: ExportWorksheetPdfOptions): Promise<void> {
  const bytes = await createWorksheetPdfBytes(options);
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = getPdfFileName(fileName);
  anchor.style.display = "none";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

function drawCalibrationMark(
  page: PDFPage,
  pageHeightPoints: number,
  startXmm: number,
  pageHeightMm: number,
  font: PDFFont,
): void {
  const yMm = pageHeightMm - 6;
  const endXmm = startXmm + 50;
  const color = hexToRgb("#6b7280");
  const yPoints = pageHeightPoints - millimetresToPoints(yMm);

  page.drawLine({
    start: { x: millimetresToPoints(startXmm), y: yPoints },
    end: { x: millimetresToPoints(endXmm), y: yPoints },
    thickness: 0.5,
    color,
  });

  for (const xMm of [startXmm, endXmm]) {
    page.drawLine({
      start: {
        x: millimetresToPoints(xMm),
        y: yPoints - millimetresToPoints(1.5),
      },
      end: {
        x: millimetresToPoints(xMm),
        y: yPoints + millimetresToPoints(1.5),
      },
      thickness: 0.5,
      color,
    });
  }

  const label = "50 mm calibration";
  const labelSize = millimetresToPoints(2.5);
  const labelWidth = font.widthOfTextAtSize(label, labelSize);
  page.drawText(label, {
    x: millimetresToPoints(startXmm + 25) - labelWidth / 2,
    y: yPoints + millimetresToPoints(1.5),
    size: labelSize,
    font,
    color,
  });
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized, 16);

  return rgb(
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  );
}

function getPdfFileName(sourceFileName: string): string {
  const baseName = sourceFileName.replace(/\.[^/.]+$/, "") || "worksheet";
  return `${baseName}-worksheet.pdf`;
}
