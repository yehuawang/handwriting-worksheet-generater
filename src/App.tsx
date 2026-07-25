import { useEffect, useMemo, useRef, useState } from "react";

import {
  createWorksheetDocumentModel,
  DEFAULT_WORKSHEET_SETTINGS,
  getFontSizeForWritingHeight,
  type GuidelineMode,
  type PageOrientation,
  type PaperSizeName,
  type WorksheetSettings,
} from "./core";
import { WorksheetPreview } from "./features/worksheet/WorksheetPreview";
import {
  loadPatrickHandFont,
  type LoadedWorksheetFont,
} from "./fonts/patrick-hand";
import "./App.css";

const SAMPLE_TEXT = `Handwriting practice
  Indented words stay indented.

Tall letters reach the top: b d f h k l t
Round letters sit in the middle: a c e o
Descending letters reach below: g j p q y`;

function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sourceText, setSourceText] = useState(SAMPLE_TEXT);
  const [sourceFileName, setSourceFileName] = useState("sample.txt");
  const [worksheetFont, setWorksheetFont] =
    useState<LoadedWorksheetFont | null>(null);
  const [fontError, setFontError] = useState<string | null>(null);
  const [settings, setSettings] = useState<WorksheetSettings>(
    DEFAULT_WORKSHEET_SETTINGS,
  );
  const [textColor, setTextColor] = useState("#475569");
  const [showCalibration, setShowCalibration] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [activePageIndex, setActivePageIndex] = useState(0);

  useEffect(() => {
    void loadPatrickHandFont()
      .then(setWorksheetFont)
      .catch((error: unknown) => {
        setFontError(
          error instanceof Error ? error.message : "Unable to load the font.",
        );
      });
  }, []);

  const effectiveSettings = useMemo<WorksheetSettings>(() => {
    if (!worksheetFont) {
      return settings;
    }

    return {
      ...settings,
      guidelines: {
        ...settings.guidelines,
        xHeightRatio: worksheetFont.metrics.xHeightRatio,
        descenderDepthRatio: worksheetFont.metrics.descenderDepthRatio,
      },
    };
  }, [settings, worksheetFont]);

  const fontSizeMm = worksheetFont
    ? getFontSizeForWritingHeight(
        effectiveSettings.guidelines.writingHeightMm,
        worksheetFont.metrics,
      )
    : effectiveSettings.guidelines.writingHeightMm;

  const worksheetDocument = useMemo(() => {
    if (!worksheetFont) {
      return null;
    }

    return createWorksheetDocumentModel(sourceText, effectiveSettings, (text) =>
      worksheetFont.font.getAdvanceWidth(text, fontSizeMm),
    );
  }, [effectiveSettings, fontSizeMm, sourceText, worksheetFont]);

  const currentPageIndex = Math.min(
    activePageIndex,
    Math.max(0, (worksheetDocument?.pages.length ?? 1) - 1),
  );
  const pageModel = worksheetDocument?.pages[currentPageIndex] ?? null;

  async function handleTextFile(file: File | undefined): Promise<void> {
    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith(".txt")) {
      setExportError("Choose a plain-text file with a .txt extension.");
      return;
    }

    setSourceText(await file.text());
    setSourceFileName(file.name);
    setExportError(null);
  }

  async function handleExport(): Promise<void> {
    if (!worksheetFont || !worksheetDocument) {
      return;
    }

    setIsExporting(true);
    setExportError(null);

    try {
      const { exportWorksheetPdf } = await import("./renderers/pdf");
      await exportWorksheetPdf({
        worksheet: worksheetDocument,
        worksheetFont,
        fontSizeMm,
        textColor,
        fileName: sourceFileName,
        showCalibration,
      });
    } catch (error: unknown) {
      setExportError(
        error instanceof Error ? error.message : "PDF export failed.",
      );
    } finally {
      setIsExporting(false);
    }
  }

  function updateGuidelines(
    values: Partial<WorksheetSettings["guidelines"]>,
  ): void {
    setSettings((current) => ({
      ...current,
      guidelines: { ...current.guidelines, ...values },
    }));
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            HW
          </span>
          <div>
            <h1>Handwriting Worksheet Generator</h1>
            <p>Printable practice pages from plain text</p>
          </div>
        </div>
        <span className="prototype-badge">Printable prototype</span>
      </header>

      <main className="workspace">
        <aside className="control-panel" aria-label="Worksheet controls">
          <section className="panel-section source-section">
            <div className="section-heading">
              <div>
                <span className="step-label">Step 1</span>
                <h2>Add your text</h2>
              </div>
              <button
                className="secondary-button compact-button"
                type="button"
                onClick={() => fileInputRef.current?.click()}
              >
                Import .txt
              </button>
              <input
                ref={fileInputRef}
                className="visually-hidden"
                type="file"
                accept=".txt,text/plain"
                onChange={(event) => {
                  void handleTextFile(event.currentTarget.files?.[0]);
                  event.currentTarget.value = "";
                }}
              />
            </div>

            <label className="field-label" htmlFor="source-text">
              Worksheet text
            </label>
            <textarea
              id="source-text"
              value={sourceText}
              spellCheck="true"
              onChange={(event) => {
                setSourceText(event.currentTarget.value);
                setSourceFileName("worksheet.txt");
              }}
            />
            <div className="field-meta">
              <span>{sourceFileName}</span>
              <span>{sourceText.length.toLocaleString()} characters</span>
            </div>
          </section>

          <section className="panel-section">
            <div className="section-heading">
              <div>
                <span className="step-label">Step 2</span>
                <h2>Set up the writing rows</h2>
              </div>
            </div>

            <div className="field-grid">
              <label className="form-field">
                <span>Guideline style</span>
                <select
                  value={settings.guidelines.mode}
                  onChange={(event) =>
                    updateGuidelines({
                      mode: event.currentTarget.value as GuidelineMode,
                    })
                  }
                >
                  <option value="baseline">Baseline only</option>
                  <option value="three-line">Three lines</option>
                  <option value="four-line">Four lines</option>
                </select>
              </label>

              <label className="form-field">
                <span>Writing height</span>
                <span className="number-control">
                  <input
                    type="number"
                    min="4"
                    max="12"
                    step="1"
                    value={settings.guidelines.writingHeightMm}
                    onChange={(event) =>
                      updateGuidelines({
                        writingHeightMm: Number(event.currentTarget.value),
                      })
                    }
                  />
                  <span>mm</span>
                </span>
              </label>

              <label className="form-field">
                <span>Gap between rows</span>
                <span className="number-control">
                  <input
                    type="number"
                    min="0"
                    max="12"
                    step="0.5"
                    value={settings.guidelines.rowGapMm}
                    onChange={(event) =>
                      updateGuidelines({
                        rowGapMm: Number(event.currentTarget.value),
                      })
                    }
                  />
                  <span>mm</span>
                </span>
              </label>

              <label className="form-field">
                <span>Example color</span>
                <span className="color-control">
                  <input
                    type="color"
                    value={textColor}
                    onChange={(event) =>
                      setTextColor(event.currentTarget.value)
                    }
                    aria-label="Example text color"
                  />
                  <span>{textColor.toUpperCase()}</span>
                </span>
              </label>
            </div>

            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={settings.practiceRows === 1}
                onChange={(event) => {
                  const practiceRows = event.currentTarget.checked ? 1 : 0;
                  setSettings((current) => ({
                    ...current,
                    practiceRows,
                  }));
                }}
              />
              <span>
                <strong>Add a practice row</strong>
                <small>Place one empty guided row after each example.</small>
              </span>
            </label>
          </section>

          <section className="panel-section">
            <div className="section-heading">
              <div>
                <span className="step-label">Step 3</span>
                <h2>Choose the page</h2>
              </div>
            </div>

            <div className="field-grid">
              <label className="form-field">
                <span>Paper size</span>
                <select
                  value={settings.paper}
                  onChange={(event) => {
                    const paper = event.currentTarget.value as PaperSizeName;
                    setSettings((current) => ({
                      ...current,
                      paper,
                    }));
                  }}
                >
                  <option value="letter">US Letter</option>
                  <option value="a4">A4</option>
                </select>
              </label>

              <label className="form-field">
                <span>Orientation</span>
                <select
                  value={settings.orientation}
                  onChange={(event) => {
                    const orientation = event.currentTarget
                      .value as PageOrientation;
                    setSettings((current) => ({
                      ...current,
                      orientation,
                    }));
                  }}
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </label>
            </div>

            <label className="checkbox-field calibration-option">
              <input
                type="checkbox"
                checked={showCalibration}
                onChange={(event) =>
                  setShowCalibration(event.currentTarget.checked)
                }
              />
              <span>
                <strong>Include 50 mm calibration mark</strong>
                <small>Print at actual size and verify it with a ruler.</small>
              </span>
            </label>
          </section>

          <div className="export-area">
            <button
              className="primary-button"
              type="button"
              disabled={!pageModel || isExporting}
              onClick={() => void handleExport()}
            >
              <DownloadIcon />
              {isExporting ? "Creating PDF…" : "Download PDF"}
            </button>
            <p>
              PDF dimensions use physical millimetres and embedded font data.
            </p>
          </div>
        </aside>

        <section className="preview-panel" aria-labelledby="preview-title">
          <div className="preview-toolbar">
            <div>
              <span className="eyebrow">Live preview</span>
              <h2 id="preview-title">Worksheet pages</h2>
            </div>
            {pageModel ? (
              <div className="page-summary" aria-label="Page summary">
                <span>
                  {Math.round(pageModel.pageSize.widthMm)} ×{" "}
                  {Math.round(pageModel.pageSize.heightMm)} mm
                </span>
                <span>{pageModel.rows.length} rows</span>
                <span>
                  Page {currentPageIndex + 1} of{" "}
                  {worksheetDocument?.pages.length ?? 1}
                </span>
              </div>
            ) : null}
          </div>

          <StatusMessages
            fontError={fontError}
            exportError={exportError}
            horizontalOverflowCount={
              worksheetDocument?.horizontalOverflowCount ?? 0
            }
          />

          <div className="preview-stage">
            {pageModel ? (
              <WorksheetPreview
                model={pageModel}
                fontSizeMm={fontSizeMm}
                textColor={textColor}
                showCalibration={showCalibration}
              />
            ) : (
              <div className="preview-loading" role="status">
                <span className="loading-dot" />
                {fontError
                  ? "Preview unavailable"
                  : "Loading handwriting font…"}
              </div>
            )}
          </div>

          {worksheetDocument && worksheetDocument.pages.length > 1 ? (
            <nav className="page-navigation" aria-label="Preview pages">
              <button
                className="secondary-button compact-button"
                type="button"
                disabled={currentPageIndex === 0}
                onClick={() =>
                  setActivePageIndex(Math.max(0, currentPageIndex - 1))
                }
              >
                Previous
              </button>
              <span>
                Page {currentPageIndex + 1} of {worksheetDocument.pages.length}
              </span>
              <button
                className="secondary-button compact-button"
                type="button"
                disabled={
                  currentPageIndex === worksheetDocument.pages.length - 1
                }
                onClick={() =>
                  setActivePageIndex(
                    Math.min(
                      worksheetDocument.pages.length - 1,
                      currentPageIndex + 1,
                    ),
                  )
                }
              >
                Next
              </button>
            </nav>
          ) : null}

          {worksheetFont ? (
            <div className="font-metrics">
              <div>
                <span className="eyebrow">Font alignment</span>
                <strong>Patrick Hand</strong>
              </div>
              <dl>
                <div>
                  <dt>X-height</dt>
                  <dd>
                    {Math.round(worksheetFont.metrics.xHeightRatio * 100)}%
                  </dd>
                </div>
                <div>
                  <dt>Descender</dt>
                  <dd>
                    {Math.round(
                      worksheetFont.metrics.descenderDepthRatio * 100,
                    )}
                    %
                  </dd>
                </div>
                <div>
                  <dt>Font scale</dt>
                  <dd>{fontSizeMm.toFixed(2)} mm</dd>
                </div>
              </dl>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}

function StatusMessages({
  fontError,
  exportError,
  horizontalOverflowCount,
}: {
  readonly fontError: string | null;
  readonly exportError: string | null;
  readonly horizontalOverflowCount: number;
}) {
  const messages = [
    fontError,
    exportError,
    horizontalOverflowCount > 0
      ? `${horizontalOverflowCount} line${horizontalOverflowCount === 1 ? "" : "s"} could not fit within the printable width.`
      : null,
  ].filter((message): message is string => Boolean(message));

  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="status-stack" aria-live="polite">
      {messages.map((message) => (
        <p className="status-message" key={message}>
          <span aria-hidden="true">!</span>
          {message}
        </p>
      ))}
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3v12m0 0 4-4m-4 4-4-4M5 20h14"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export default App;
