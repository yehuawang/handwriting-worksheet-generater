import {
  createGuidelineGeometry,
  type GuidelineGeometry,
  type GuidelineSettings,
} from "./guidelines";
import {
  getOrientedPageSize,
  type PageOrientation,
  type PageSize,
  type PaperSizeName,
} from "./page";
import { getSourceLines } from "./text";

export interface WorksheetSettings {
  readonly paper: PaperSizeName;
  readonly orientation: PageOrientation;
  readonly marginMm: number;
  readonly tabWidth: number;
  readonly practiceRows: 0 | 1;
  readonly guidelines: GuidelineSettings;
}

export interface WorksheetRow {
  readonly id: string;
  readonly sourceLineIndex: number;
  readonly kind: "example" | "practice";
  readonly text: string;
  readonly topYmm: number;
  readonly baselineYmm: number;
  readonly textWidthMm: number;
  readonly overflowsHorizontally: boolean;
}

export interface WorksheetPageModel {
  readonly pageSize: PageSize;
  readonly contentWidthMm: number;
  readonly contentHeightMm: number;
  readonly guidelineGeometry: GuidelineGeometry;
  readonly rows: readonly WorksheetRow[];
  readonly omittedSourceLineCount: number;
  readonly horizontalOverflowCount: number;
}

export type MeasureText = (text: string) => number;

export const DEFAULT_WORKSHEET_SETTINGS: WorksheetSettings = {
  paper: "letter",
  orientation: "portrait",
  marginMm: 12.7,
  tabWidth: 4,
  practiceRows: 1,
  guidelines: {
    writingHeightMm: 6,
    xHeightRatio: 0.55,
    descenderDepthRatio: 0.35,
    rowGapMm: 2,
    mode: "four-line",
  },
};

export function createWorksheetPageModel(
  sourceText: string,
  settings: WorksheetSettings,
  measureText: MeasureText,
): WorksheetPageModel {
  validateSettings(settings);

  const pageSize = getOrientedPageSize(settings.paper, settings.orientation);
  const contentWidthMm = pageSize.widthMm - settings.marginMm * 2;
  const contentHeightMm = pageSize.heightMm - settings.marginMm * 2;
  const guidelineGeometry = createGuidelineGeometry(settings.guidelines);
  const sourceLines = getSourceLines(sourceText, settings.tabWidth);
  const rows: WorksheetRow[] = [];
  let cursorYmm = settings.marginMm;
  let consumedSourceLines = 0;

  for (const [sourceLineIndex, text] of sourceLines.entries()) {
    const practiceRowsForLine = text.length > 0 ? settings.practiceRows : 0;
    const rowsRequired = 1 + practiceRowsForLine;
    const groupHeightMm =
      guidelineGeometry.rowHeightMm * rowsRequired +
      settings.guidelines.rowGapMm * (rowsRequired - 1);

    if (cursorYmm + groupHeightMm > pageSize.heightMm - settings.marginMm) {
      break;
    }

    rows.push(
      createRow(
        `source-${sourceLineIndex}`,
        sourceLineIndex,
        "example",
        text,
        cursorYmm,
        settings.marginMm,
        contentWidthMm,
        guidelineGeometry,
        measureText,
      ),
    );
    cursorYmm += guidelineGeometry.rowPitchMm;

    if (practiceRowsForLine === 1) {
      rows.push(
        createRow(
          `practice-${sourceLineIndex}`,
          sourceLineIndex,
          "practice",
          "",
          cursorYmm,
          settings.marginMm,
          contentWidthMm,
          guidelineGeometry,
          measureText,
        ),
      );
      cursorYmm += guidelineGeometry.rowPitchMm;
    }

    consumedSourceLines += 1;
  }

  return {
    pageSize,
    contentWidthMm,
    contentHeightMm,
    guidelineGeometry,
    rows,
    omittedSourceLineCount: sourceLines.length - consumedSourceLines,
    horizontalOverflowCount: rows.filter(
      ({ overflowsHorizontally }) => overflowsHorizontally,
    ).length,
  };
}

function createRow(
  id: string,
  sourceLineIndex: number,
  kind: WorksheetRow["kind"],
  text: string,
  topYmm: number,
  leftXmm: number,
  contentWidthMm: number,
  geometry: GuidelineGeometry,
  measureText: MeasureText,
): WorksheetRow {
  const textWidthMm = text.length > 0 ? measureText(text) : 0;

  return {
    id,
    sourceLineIndex,
    kind,
    text,
    topYmm,
    baselineYmm: topYmm + geometry.writingHeightMm,
    textWidthMm,
    overflowsHorizontally: leftXmm + textWidthMm > leftXmm + contentWidthMm,
  };
}

function validateSettings(settings: WorksheetSettings): void {
  if (!Number.isFinite(settings.marginMm) || settings.marginMm <= 0) {
    throw new RangeError("marginMm must be greater than zero.");
  }

  const pageSize = getOrientedPageSize(settings.paper, settings.orientation);
  if (
    settings.marginMm * 2 >= pageSize.widthMm ||
    settings.marginMm * 2 >= pageSize.heightMm
  ) {
    throw new RangeError("Margins must leave a printable page area.");
  }
}
