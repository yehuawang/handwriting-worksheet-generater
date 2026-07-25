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
  readonly pageLabels: PageLabelSettings;
  readonly guidelines: GuidelineSettings;
}

export interface PageLabelSettings {
  readonly showHeader: boolean;
  readonly headerLeft: string;
  readonly headerRight: string;
  readonly headerFontSizeMm: number;
  readonly showFooter: boolean;
  readonly footerCenter: string;
  readonly footerFontSizeMm: number;
}

export interface WorksheetMetadata {
  readonly fileName: string;
}

export interface WorksheetPageLabels {
  readonly headerLeft: string;
  readonly headerRight: string;
  readonly footerCenter: string;
  readonly headerFontSizeMm: number;
  readonly footerFontSizeMm: number;
  readonly headerBaselineYmm: number;
  readonly footerBaselineYmm: number;
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
  readonly contentLeftMm: number;
  readonly contentTopMm: number;
  readonly contentBottomMm: number;
  readonly labels: WorksheetPageLabels;
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
  pageLabels: {
    showHeader: true,
    headerLeft: "{fileName}",
    headerRight: "Date: __________",
    headerFontSizeMm: 3,
    showFooter: true,
    footerCenter: "Page {page} of {pages}",
    footerFontSizeMm: 3,
  },
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
  metadata: WorksheetMetadata = { fileName: "worksheet.txt" },
): WorksheetDocumentModel {
  validateSettings(settings);

  const pageSize = getOrientedPageSize(settings.paper, settings.orientation);
  const contentWidthMm = pageSize.widthMm - settings.marginMm * 2;
  const headerReservationMm = settings.pageLabels.showHeader
    ? settings.pageLabels.headerFontSizeMm + 6
    : 0;
  const footerReservationMm = settings.pageLabels.showFooter
    ? settings.pageLabels.footerFontSizeMm + 6
    : 0;
  const contentTopMm = settings.marginMm + headerReservationMm;
  const contentBottomMm =
    pageSize.heightMm - settings.marginMm - footerReservationMm;
  const contentHeightMm = contentBottomMm - contentTopMm;
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
  let cursorYmm = contentTopMm;

  for (const line of layoutLines) {
    const practiceRowsForLine =
      line.text.length > 0 ? settings.practiceRows : 0;
    const rowsRequired = 1 + practiceRowsForLine;
    const groupHeightMm =
      guidelineGeometry.rowHeightMm * rowsRequired +
      settings.guidelines.rowGapMm * (rowsRequired - 1);

    if (
      cursorYmm + groupHeightMm > contentBottomMm &&
      pageRows[pageRows.length - 1].length > 0
    ) {
      pageRows.push([]);
      cursorYmm = contentTopMm;
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

  const pageCount = pageRows.length;
  const pages = pageRows.map((rows, index): WorksheetPageModel => {
    const horizontalOverflowCount = rows.filter(
      ({ overflowsHorizontally }) => overflowsHorizontally,
    ).length;

    return {
      pageNumber: index + 1,
      pageSize,
      contentWidthMm,
      contentHeightMm,
      contentLeftMm: settings.marginMm,
      contentTopMm,
      contentBottomMm,
      labels: createPageLabels(
        settings.pageLabels,
        metadata,
        index + 1,
        pageCount,
        settings.marginMm,
        pageSize.heightMm,
      ),
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

function createPageLabels(
  settings: PageLabelSettings,
  metadata: WorksheetMetadata,
  pageNumber: number,
  pageCount: number,
  marginMm: number,
  pageHeightMm: number,
): WorksheetPageLabels {
  const values = {
    fileName: metadata.fileName,
    page: String(pageNumber),
    pages: String(pageCount),
  };

  return {
    headerLeft: settings.showHeader
      ? resolvePageLabel(settings.headerLeft, values)
      : "",
    headerRight: settings.showHeader
      ? resolvePageLabel(settings.headerRight, values)
      : "",
    footerCenter: settings.showFooter
      ? resolvePageLabel(settings.footerCenter, values)
      : "",
    headerFontSizeMm: settings.headerFontSizeMm,
    footerFontSizeMm: settings.footerFontSizeMm,
    headerBaselineYmm: marginMm + settings.headerFontSizeMm,
    footerBaselineYmm: pageHeightMm - marginMm - 2,
  };
}

export function resolvePageLabel(
  template: string,
  values: Readonly<Record<"fileName" | "page" | "pages", string>>,
): string {
  return template.replace(
    /\{(fileName|page|pages)\}/g,
    (_, token: keyof typeof values) => values[token],
  );
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
    pageSize.heightMm -
      settings.marginMm * 2 -
      (settings.pageLabels.showHeader
        ? settings.pageLabels.headerFontSizeMm + 6
        : 0) -
      (settings.pageLabels.showFooter
        ? settings.pageLabels.footerFontSizeMm + 6
        : 0)
  ) {
    throw new RangeError("The selected row geometry does not fit on the page.");
  }

  for (const [name, value] of [
    ["headerFontSizeMm", settings.pageLabels.headerFontSizeMm],
    ["footerFontSizeMm", settings.pageLabels.footerFontSizeMm],
  ] as const) {
    if (!Number.isFinite(value) || value < 2 || value > 8) {
      throw new RangeError(`${name} must be between 2 and 8 millimetres.`);
    }
  }
}
