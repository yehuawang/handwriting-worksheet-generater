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
import { getSourceLines, wrapTextLine } from "./text";

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
  readonly continuationIndex: number;
  readonly kind: "example" | "practice";
  readonly text: string;
  readonly topYmm: number;
  readonly baselineYmm: number;
  readonly textWidthMm: number;
  readonly overflowsHorizontally: boolean;
}

export interface WorksheetPageModel {
  readonly pageNumber: number;
  readonly pageSize: PageSize;
  readonly contentWidthMm: number;
  readonly contentHeightMm: number;
  readonly guidelineGeometry: GuidelineGeometry;
  readonly rows: readonly WorksheetRow[];
  readonly horizontalOverflowCount: number;
}

export interface WorksheetDocumentModel {
  readonly pages: readonly WorksheetPageModel[];
  readonly sourceLineCount: number;
  readonly wrappedLineCount: number;
  readonly horizontalOverflowCount: number;
}

interface LayoutTextLine {
  readonly sourceLineIndex: number;
  readonly continuationIndex: number;
  readonly text: string;
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

export function createWorksheetDocumentModel(
  sourceText: string,
  settings: WorksheetSettings,
  measureText: MeasureText,
): WorksheetDocumentModel {
  validateSettings(settings);

  const pageSize = getOrientedPageSize(settings.paper, settings.orientation);
  const contentWidthMm = pageSize.widthMm - settings.marginMm * 2;
  const contentHeightMm = pageSize.heightMm - settings.marginMm * 2;
  const guidelineGeometry = createGuidelineGeometry(settings.guidelines);
  const sourceLines = getSourceLines(sourceText, settings.tabWidth);
  const layoutLines: LayoutTextLine[] = sourceLines.flatMap(
    (sourceLine, sourceLineIndex) =>
      wrapTextLine(sourceLine, contentWidthMm, measureText).map(
        ({ text, continuationIndex }) => ({
          sourceLineIndex,
          continuationIndex,
          text,
        }),
      ),
  );
  const pageRows: WorksheetRow[][] = [[]];
  let cursorYmm = settings.marginMm;

  for (const line of layoutLines) {
    const practiceRowsForLine =
      line.text.length > 0 ? settings.practiceRows : 0;
    const rowsRequired = 1 + practiceRowsForLine;
    const groupHeightMm =
      guidelineGeometry.rowHeightMm * rowsRequired +
      settings.guidelines.rowGapMm * (rowsRequired - 1);

    if (
      cursorYmm + groupHeightMm > pageSize.heightMm - settings.marginMm &&
      pageRows[pageRows.length - 1].length > 0
    ) {
      pageRows.push([]);
      cursorYmm = settings.marginMm;
    }

    pageRows[pageRows.length - 1].push(
      createRow(
        line,
        "example",
        line.text,
        cursorYmm,
        contentWidthMm,
        guidelineGeometry,
        measureText,
      ),
    );
    cursorYmm += guidelineGeometry.rowPitchMm;

    if (practiceRowsForLine === 1) {
      pageRows[pageRows.length - 1].push(
        createRow(
          line,
          "practice",
          "",
          cursorYmm,
          contentWidthMm,
          guidelineGeometry,
          measureText,
        ),
      );
      cursorYmm += guidelineGeometry.rowPitchMm;
    }
  }

  const pages = pageRows.map((rows, index): WorksheetPageModel => {
    const horizontalOverflowCount = rows.filter(
      ({ overflowsHorizontally }) => overflowsHorizontally,
    ).length;

    return {
      pageNumber: index + 1,
      pageSize,
      contentWidthMm,
      contentHeightMm,
      guidelineGeometry,
      rows,
      horizontalOverflowCount,
    };
  });

  return {
    pages,
    sourceLineCount: sourceLines.length,
    wrappedLineCount: layoutLines.length,
    horizontalOverflowCount: pages.reduce(
      (total, page) => total + page.horizontalOverflowCount,
      0,
    ),
  };
}

function createRow(
  line: LayoutTextLine,
  kind: WorksheetRow["kind"],
  text: string,
  topYmm: number,
  contentWidthMm: number,
  geometry: GuidelineGeometry,
  measureText: MeasureText,
): WorksheetRow {
  const textWidthMm = text.length > 0 ? measureText(text) : 0;

  return {
    id: `${kind}-${line.sourceLineIndex}-${line.continuationIndex}`,
    sourceLineIndex: line.sourceLineIndex,
    continuationIndex: line.continuationIndex,
    kind,
    text,
    topYmm,
    baselineYmm: topYmm + geometry.writingHeightMm,
    textWidthMm,
    overflowsHorizontally: textWidthMm > contentWidthMm,
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

  const geometry = createGuidelineGeometry(settings.guidelines);
  if (
    geometry.rowHeightMm * (1 + settings.practiceRows) >
    pageSize.heightMm - settings.marginMm * 2
  ) {
    throw new RangeError("The selected row geometry does not fit on the page.");
  }
}
