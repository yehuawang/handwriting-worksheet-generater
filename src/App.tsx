import { useEffect, useMemo, useRef, useState } from "react";

import {
  createWorksheetDocumentModel,
  getFontSizeForWritingHeight,
  type GuidelineMode,
  type PageOrientation,
  type PaperSizeName,
  type WorksheetSettings,
} from "./core";
import { WorksheetPreview } from "./features/worksheet/WorksheetPreview";
import { loadCustomWorksheetFont } from "./fonts/custom-font";
import { findMissingGlyphs, type MissingGlyph } from "./fonts/glyph-coverage";
import {
  BUILT_IN_FONTS,
  isBuiltInFontId,
  loadBuiltInFont,
  type LoadedWorksheetFont,
} from "./fonts/worksheet-fonts";
import {
  isDesktopRuntime,
  openDesktopTextDocument,
  saveDesktopPdf,
} from "./platform/desktop-files";
import {
  createPreset,
  DEFAULT_WORKSHEET_CONFIGURATION,
  loadWorksheetPreferences,
  saveWorksheetPreferences,
  upsertPreset,
  type WorksheetConfiguration,
} from "./settings/worksheet-preferences";
import {
  deleteLocalAsset,
  deletePresetAssets,
  getPresetFontAssetId,
  getPresetTextAssetId,
  loadFontAsset,
  loadTextAsset,
  saveFontAsset,
  saveTextAsset,
} from "./storage/local-assets";
import "./App.css";

const SAMPLE_TEXT = `Handwriting practice
  Indented words stay indented.

Tall letters reach the top: b d f h k l t
Round letters sit in the middle: a c e o
Descending letters reach below: g j p q y`;

function App() {
  const [initialPreferences] = useState(loadWorksheetPreferences);
  const initialBuiltInFontId = isBuiltInFontId(
    initialPreferences.recent.builtInFontId,
  )
    ? initialPreferences.recent.builtInFontId
    : DEFAULT_WORKSHEET_CONFIGURATION.builtInFontId;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fontInputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);
  const lastBuiltInFontIdRef = useRef(initialBuiltInFontId);
  const [sourceText, setSourceText] = useState(SAMPLE_TEXT);
  const [sourceFileName, setSourceFileName] = useState("sample.txt");
  const [worksheetFont, setWorksheetFont] =
    useState<LoadedWorksheetFont | null>(null);
  const [selectedFontId, setSelectedFontId] = useState(initialBuiltInFontId);
  const [customFont, setCustomFont] = useState<LoadedWorksheetFont | null>(
    null,
  );
  const [customFontSource, setCustomFontSource] = useState<{
    readonly fileName: string;
    readonly mimeType: string;
    readonly lastModified: number;
  } | null>(null);
  const [isLoadingFont, setIsLoadingFont] = useState(false);
  const [fontError, setFontError] = useState<string | null>(null);
  const [settings, setSettings] = useState<WorksheetSettings>(
    initialPreferences.recent.settings,
  );
  const [textColor, setTextColor] = useState(
    initialPreferences.recent.textColor,
  );
  const [showCalibration, setShowCalibration] = useState(
    initialPreferences.recent.showCalibration,
  );
  const [presets, setPresets] = useState(initialPreferences.presets);
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [presetName, setPresetName] = useState("");
  const [presetMessage, setPresetMessage] = useState<string | null>(null);
  const [includeTextInPreset, setIncludeTextInPreset] = useState(false);
  const [includeFontInPreset, setIncludeFontInPreset] = useState(false);
  const [isUpdatingPreset, setIsUpdatingPreset] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [previewZoom, setPreviewZoom] = useState(100);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  useEffect(() => {
    if (!isBuiltInFontId(selectedFontId)) {
      return;
    }

    let isCurrentSelection = true;

    void loadBuiltInFont(selectedFontId)
      .then((font) => {
        if (isCurrentSelection) {
          setWorksheetFont(font);
        }
      })
      .catch((error: unknown) => {
        if (isCurrentSelection) {
          setFontError(
            error instanceof Error ? error.message : "Unable to load the font.",
          );
        }
      });

    return () => {
      isCurrentSelection = false;
    };
  }, [selectedFontId]);

  useEffect(() => {
    if (isBuiltInFontId(selectedFontId)) {
      lastBuiltInFontIdRef.current = selectedFontId;
    }

    saveWorksheetPreferences({
      version: 1,
      recent: {
        settings,
        textColor,
        showCalibration,
        builtInFontId: lastBuiltInFontIdRef.current,
      },
      presets,
    });
  }, [presets, selectedFontId, settings, showCalibration, textColor]);

  const selectedFontFamily =
    customFont?.id === selectedFontId
      ? customFont.cssFamilyName
      : (BUILT_IN_FONTS.find(({ id }) => id === selectedFontId)?.familyName ??
        "Patrick Hand");

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

    return createWorksheetDocumentModel(
      sourceText,
      effectiveSettings,
      (text) => worksheetFont.font.getAdvanceWidth(text, fontSizeMm),
      { fileName: sourceFileName },
    );
  }, [
    effectiveSettings,
    fontSizeMm,
    sourceFileName,
    sourceText,
    worksheetFont,
  ]);

  const currentPageIndex = Math.min(
    activePageIndex,
    Math.max(0, (worksheetDocument?.pages.length ?? 1) - 1),
  );
  const pageModel = worksheetDocument?.pages[currentPageIndex] ?? null;
  const missingGlyphs = useMemo(
    () =>
      worksheetFont
        ? findMissingGlyphs(sourceText, worksheetFont.font)
        : ([] satisfies readonly MissingGlyph[]),
    [sourceText, worksheetFont],
  );

  async function handleImportClick(): Promise<void> {
    if (!isDesktopRuntime()) {
      fileInputRef.current?.click();
      return;
    }

    try {
      const document = await openDesktopTextDocument();
      if (document) {
        setSourceText(document.text);
        setSourceFileName(document.fileName);
        setExportError(null);
      }
    } catch (error: unknown) {
      setExportError(
        error instanceof Error
          ? error.message
          : "Unable to open the text file.",
      );
    }
  }

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

  async function handleCustomFont(file: File | undefined): Promise<void> {
    if (!file) {
      return;
    }

    setIsLoadingFont(true);
    setFontError(null);

    try {
      const font = await loadCustomWorksheetFont(file);
      setCustomFont(font);
      setCustomFontSource({
        fileName: file.name,
        mimeType: file.type || getFontMimeType(file.name),
        lastModified: file.lastModified,
      });
      setWorksheetFont(font);
      setSelectedFontId(font.id);
    } catch (error: unknown) {
      setFontError(
        error instanceof Error ? error.message : "Unable to load the font.",
      );
    } finally {
      setIsLoadingFont(false);
    }
  }

  async function handleDroppedFiles(files: FileList): Promise<void> {
    const file = Array.from(files).find((candidate) =>
      /\.(txt|ttf|otf)$/i.test(candidate.name),
    );

    setIsDraggingFile(false);
    dragDepthRef.current = 0;
    if (!file) {
      setExportError("Drop a .txt, .ttf, or .otf file.");
      return;
    }

    if (file.name.toLowerCase().endsWith(".txt")) {
      await handleTextFile(file);
      setActiveStep(1);
    } else {
      await handleCustomFont(file);
      setActiveStep(2);
    }
  }

  function getCurrentConfiguration(): WorksheetConfiguration {
    return {
      settings,
      textColor,
      showCalibration,
      builtInFontId: lastBuiltInFontIdRef.current,
    };
  }

  function applyConfiguration(
    configuration: WorksheetConfiguration,
    applyBuiltInFont = true,
  ): void {
    setSettings(configuration.settings);
    setTextColor(configuration.textColor);
    setShowCalibration(configuration.showCalibration);
    if (applyBuiltInFont && isBuiltInFontId(configuration.builtInFontId)) {
      setSelectedFontId(configuration.builtInFontId);
    }
    setActivePageIndex(0);
  }

  async function handleSavePreset(): Promise<void> {
    setIsUpdatingPreset(true);
    try {
      const existingPreset = presets.find(
        ({ name }) =>
          name.toLocaleLowerCase() === presetName.trim().toLocaleLowerCase(),
      );
      const draftPreset = createPreset(
        presetName,
        getCurrentConfiguration(),
        existingPreset?.id,
      );
      const textAssetId = getPresetTextAssetId(draftPreset.id);
      const customFontAssetId = getPresetFontAssetId(draftPreset.id);

      if (includeTextInPreset) {
        await saveTextAsset({
          id: textAssetId,
          fileName: sourceFileName,
          text: sourceText,
        });
      } else {
        await deleteLocalAsset(textAssetId);
      }

      const canStoreCurrentFont =
        includeFontInPreset &&
        customFont?.id === selectedFontId &&
        customFontSource;
      if (canStoreCurrentFont) {
        await saveFontAsset({
          id: customFontAssetId,
          fileName: customFontSource.fileName,
          mimeType: customFontSource.mimeType,
          lastModified: customFontSource.lastModified,
          bytes: copyArrayBuffer(customFont.bytes),
        });
      }
      const shouldKeepStoredFont = Boolean(
        canStoreCurrentFont ||
        (includeFontInPreset && existingPreset?.customFontAssetId),
      );
      if (!shouldKeepStoredFont) {
        await deleteLocalAsset(customFontAssetId);
      }

      const preset = createPreset(
        draftPreset.name,
        {
          ...getCurrentConfiguration(),
          ...(includeTextInPreset ? { textAssetId } : {}),
          ...(shouldKeepStoredFont ? { customFontAssetId } : {}),
        },
        draftPreset.id,
      );
      setPresets((current) => upsertPreset(current, preset));
      setSelectedPresetId(preset.id);
      setPresetName(preset.name);
      setPresetMessage(`Saved “${preset.name}” on this device.`);
    } catch (error: unknown) {
      setPresetMessage(
        error instanceof Error ? error.message : "Unable to save the preset.",
      );
    } finally {
      setIsUpdatingPreset(false);
    }
  }

  async function handleApplyPreset(): Promise<void> {
    const preset = presets.find(({ id }) => id === selectedPresetId);
    if (!preset) {
      setPresetMessage("Choose a saved preset first.");
      return;
    }
    setIsUpdatingPreset(true);
    try {
      const [textAsset, fontAsset] = await Promise.all([
        preset.textAssetId ? loadTextAsset(preset.textAssetId) : null,
        preset.customFontAssetId
          ? loadFontAsset(preset.customFontAssetId)
          : null,
      ]);

      applyConfiguration(preset, !preset.customFontAssetId);
      if (preset.textAssetId) {
        if (!textAsset) {
          throw new Error("The text saved with this preset is unavailable.");
        }
        setSourceText(textAsset.text);
        setSourceFileName(textAsset.fileName);
      }
      if (preset.customFontAssetId) {
        if (!fontAsset) {
          throw new Error("The font saved with this preset is unavailable.");
        }
        const fontFile = new File([fontAsset.bytes], fontAsset.fileName, {
          type: fontAsset.mimeType,
          lastModified: fontAsset.lastModified,
        });
        const font = await loadCustomWorksheetFont(fontFile);
        setCustomFont(font);
        setCustomFontSource({
          fileName: fontAsset.fileName,
          mimeType: fontAsset.mimeType,
          lastModified: fontAsset.lastModified,
        });
        setWorksheetFont(font);
        setSelectedFontId(font.id);
      }

      setPresetName(preset.name);
      setIncludeTextInPreset(Boolean(preset.textAssetId));
      setIncludeFontInPreset(Boolean(preset.customFontAssetId));
      setPresetMessage(`Applied “${preset.name}”.`);
    } catch (error: unknown) {
      setPresetMessage(
        error instanceof Error ? error.message : "Unable to apply the preset.",
      );
    } finally {
      setIsUpdatingPreset(false);
    }
  }

  async function handleDeletePreset(): Promise<void> {
    const preset = presets.find(({ id }) => id === selectedPresetId);
    if (!preset) {
      setPresetMessage("Choose a saved preset first.");
      return;
    }
    setIsUpdatingPreset(true);
    try {
      await deletePresetAssets(preset.id);
      setPresets((current) => current.filter(({ id }) => id !== preset.id));
      setSelectedPresetId("");
      setPresetName("");
      setIncludeTextInPreset(false);
      setIncludeFontInPreset(false);
      setPresetMessage(`Deleted “${preset.name}” and its saved files.`);
    } catch (error: unknown) {
      setPresetMessage(
        error instanceof Error ? error.message : "Unable to delete the preset.",
      );
    } finally {
      setIsUpdatingPreset(false);
    }
  }

  function handleResetSettings(): void {
    applyConfiguration(DEFAULT_WORKSHEET_CONFIGURATION);
    setSelectedPresetId("");
    setPresetName("");
    setIncludeTextInPreset(false);
    setIncludeFontInPreset(false);
    setPresetMessage("Restored the recommended defaults.");
  }

  async function handleExport(): Promise<void> {
    if (!worksheetFont || !worksheetDocument) {
      return;
    }

    setIsExporting(true);
    setExportError(null);

    try {
      const pdfRenderer = await import("./renderers/pdf");
      const options = {
        worksheet: worksheetDocument,
        worksheetFont,
        fontSizeMm,
        textColor,
        showCalibration,
      };

      if (isDesktopRuntime()) {
        const bytes = await pdfRenderer.createWorksheetPdfBytes(options);
        await saveDesktopPdf(bytes, pdfRenderer.getPdfFileName(sourceFileName));
      } else {
        await pdfRenderer.exportWorksheetPdf({
          ...options,
          fileName: sourceFileName,
        });
      }
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

  function updatePageLabels(
    values: Partial<WorksheetSettings["pageLabels"]>,
  ): void {
    setSettings((current) => ({
      ...current,
      pageLabels: { ...current.pageLabels, ...values },
    }));
  }

  return (
    <div
      className="app-shell"
      onDragEnter={(event) => {
        event.preventDefault();
        dragDepthRef.current += 1;
        setIsDraggingFile(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => {
        event.preventDefault();
        dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
        if (dragDepthRef.current === 0) {
          setIsDraggingFile(false);
        }
      }}
      onDrop={(event) => {
        event.preventDefault();
        dragDepthRef.current = 0;
        void handleDroppedFiles(event.dataTransfer.files);
      }}
    >
      <header className="app-header">
        <div className="brand">
          <img className="brand-mark" src="/brand-mark.svg" alt="" />
          <div>
            <h1>Handwriting Worksheet Generator</h1>
            <p>Printable practice pages from plain text</p>
          </div>
        </div>
        <div className="header-actions">
          <span className="global-drop-hint">
            <UploadIcon />
            <span>
              <strong>Drag and drop anywhere</strong>
              <small>.txt, .ttf, or .otf</small>
            </span>
          </span>
          <span className="prototype-badge">Printable prototype</span>
        </div>
      </header>

      <main className="workspace">
        <aside className="control-panel" aria-label="Worksheet controls">
          <div className="control-sections">
            <section
              className="panel-section source-section"
              data-expanded={activeStep === 1}
            >
              <button
                className="section-heading accordion-toggle"
                type="button"
                aria-expanded={activeStep === 1}
                aria-controls="step-1-content"
                onClick={() => setActiveStep(1)}
              >
                <div>
                  <span className="step-label">Step 1</span>
                  <h2>Add your text</h2>
                </div>
                <AccordionChevron expanded={activeStep === 1} />
              </button>
              {activeStep === 1 ? (
                <div className="panel-section-content" id="step-1-content">
                  <button
                    className="secondary-button compact-button import-button"
                    type="button"
                    onClick={() => void handleImportClick()}
                  >
                    Import .txt file
                  </button>
                  <p className="drop-discovery-note">
                    Or drag and drop a .txt file anywhere in this window.
                  </p>
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
                </div>
              ) : null}
            </section>

            <section className="panel-section" data-expanded={activeStep === 2}>
              <button
                className="section-heading accordion-toggle"
                type="button"
                aria-expanded={activeStep === 2}
                aria-controls="step-2-content"
                onClick={() => setActiveStep(2)}
              >
                <div>
                  <span className="step-label">Step 2</span>
                  <h2>Set up the writing rows</h2>
                </div>
                <AccordionChevron expanded={activeStep === 2} />
              </button>

              {activeStep === 2 ? (
                <div className="panel-section-content" id="step-2-content">
                  <fieldset className="preset-settings">
                    <legend>Local presets</legend>
                    <label className="form-field" htmlFor="saved-preset">
                      <span>Saved preset</span>
                      <select
                        id="saved-preset"
                        value={selectedPresetId}
                        onChange={(event) => {
                          const presetId = event.currentTarget.value;
                          setSelectedPresetId(presetId);
                          const preset = presets.find(
                            ({ id }) => id === presetId,
                          );
                          setPresetName(preset?.name ?? "");
                          setIncludeTextInPreset(Boolean(preset?.textAssetId));
                          setIncludeFontInPreset(
                            Boolean(preset?.customFontAssetId),
                          );
                          setPresetMessage(null);
                        }}
                      >
                        <option value="">Choose a preset</option>
                        {presets.map(({ id, name }) => (
                          <option key={id} value={id}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="preset-actions">
                      <button
                        className="secondary-button compact-button"
                        type="button"
                        disabled={!selectedPresetId}
                        onClick={() => void handleApplyPreset()}
                      >
                        Apply
                      </button>
                      <button
                        className="text-button danger-text-button"
                        type="button"
                        disabled={!selectedPresetId}
                        onClick={() => void handleDeletePreset()}
                      >
                        Delete
                      </button>
                    </div>
                    <label className="form-field" htmlFor="preset-name">
                      <span>Preset name</span>
                      <input
                        id="preset-name"
                        type="text"
                        maxLength={60}
                        value={presetName}
                        placeholder="For example, Daily practice"
                        onChange={(event) => {
                          setPresetName(event.currentTarget.value);
                          setPresetMessage(null);
                        }}
                      />
                    </label>
                    <div className="preset-file-options">
                      <label className="checkbox-field compact-checkbox-field">
                        <input
                          type="checkbox"
                          checked={includeTextInPreset}
                          onChange={(event) =>
                            setIncludeTextInPreset(event.currentTarget.checked)
                          }
                        />
                        <span>
                          <strong>Include current text</strong>
                          <small>
                            Save a private snapshot with this preset.
                          </small>
                        </span>
                      </label>
                      <label className="checkbox-field compact-checkbox-field">
                        <input
                          type="checkbox"
                          checked={includeFontInPreset}
                          disabled={
                            !customFont || customFont.id !== selectedFontId
                          }
                          onChange={(event) =>
                            setIncludeFontInPreset(event.currentTarget.checked)
                          }
                        />
                        <span>
                          <strong>Keep uploaded font</strong>
                          <small>
                            Available when the current font was uploaded.
                          </small>
                        </span>
                      </label>
                    </div>
                    <div className="preset-actions">
                      <button
                        className="secondary-button compact-button"
                        type="button"
                        disabled={!presetName.trim() || isUpdatingPreset}
                        onClick={() => void handleSavePreset()}
                      >
                        {isUpdatingPreset ? "Saving…" : "Save current"}
                      </button>
                      <button
                        className="text-button"
                        type="button"
                        onClick={handleResetSettings}
                      >
                        Reset defaults
                      </button>
                    </div>
                    <p className="preset-note">
                      Presets and included files stay only in this app on this
                      device. You are responsible for uploaded-font licensing.
                    </p>
                    <p
                      className="preset-message"
                      role="status"
                      aria-live="polite"
                    >
                      {presetMessage}
                    </p>
                  </fieldset>

                  <div className="field-grid">
                    <div className="form-field">
                      <label htmlFor="worksheet-font">Handwriting font</label>
                      <select
                        id="worksheet-font"
                        className="font-select"
                        style={{ fontFamily: `"${selectedFontFamily}"` }}
                        value={selectedFontId}
                        onChange={(event) => {
                          setFontError(null);
                          const fontId = event.currentTarget.value;
                          setSelectedFontId(fontId);
                          if (isBuiltInFontId(fontId)) {
                            setIncludeFontInPreset(false);
                          }
                          if (customFont?.id === fontId) {
                            setWorksheetFont(customFont);
                          }
                        }}
                      >
                        {BUILT_IN_FONTS.map(({ id, familyName }) => (
                          <option
                            key={id}
                            value={id}
                            style={{ fontFamily: `"${familyName}"` }}
                          >
                            {familyName}
                          </option>
                        ))}
                        {customFont ? (
                          <option
                            value={customFont.id}
                            style={{
                              fontFamily: `"${customFont.cssFamilyName}"`,
                            }}
                          >
                            {customFont.familyName} (uploaded)
                          </option>
                        ) : null}
                      </select>
                      <button
                        className="font-upload-button"
                        type="button"
                        disabled={isLoadingFont}
                        onClick={() => fontInputRef.current?.click()}
                      >
                        {isLoadingFont ? "Loading font…" : "Upload TTF or OTF"}
                      </button>
                      <input
                        ref={fontInputRef}
                        className="visually-hidden"
                        type="file"
                        accept=".ttf,.otf,font/ttf,font/otf"
                        onChange={(event) => {
                          void handleCustomFont(event.currentTarget.files?.[0]);
                          event.currentTarget.value = "";
                        }}
                      />
                      <small className="font-upload-note">
                        Used only on this device and embedded in the PDF.
                      </small>
                      <small className="drop-discovery-note font-drop-note">
                        You can also drop a .ttf or .otf file anywhere in this
                        window.
                      </small>
                    </div>

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
                        <option value="none">None</option>
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
                              writingHeightMm: Number(
                                event.currentTarget.value,
                              ),
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
                        const practiceRows = event.currentTarget.checked
                          ? 1
                          : 0;
                        setSettings((current) => ({
                          ...current,
                          practiceRows,
                        }));
                      }}
                    />
                    <span>
                      <strong>Add a practice row</strong>
                      <small>
                        Place one empty guided row after each example.
                      </small>
                    </span>
                  </label>
                </div>
              ) : null}
            </section>

            <section className="panel-section" data-expanded={activeStep === 3}>
              <button
                className="section-heading accordion-toggle"
                type="button"
                aria-expanded={activeStep === 3}
                aria-controls="step-3-content"
                onClick={() => setActiveStep(3)}
              >
                <div>
                  <span className="step-label">Step 3</span>
                  <h2>Choose the page</h2>
                </div>
                <AccordionChevron expanded={activeStep === 3} />
              </button>

              {activeStep === 3 ? (
                <div className="panel-section-content" id="step-3-content">
                  <div className="field-grid">
                    <label className="form-field">
                      <span>Paper size</span>
                      <select
                        value={settings.paper}
                        onChange={(event) => {
                          const paper = event.currentTarget
                            .value as PaperSizeName;
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

                    <label className="form-field">
                      <span>Page margin</span>
                      <span className="number-control">
                        <input
                          type="number"
                          min="5"
                          max="30"
                          step="0.5"
                          value={settings.marginMm}
                          onChange={(event) => {
                            const marginMm = Number(event.currentTarget.value);
                            if (marginMm >= 5 && marginMm <= 30) {
                              setSettings((current) => ({
                                ...current,
                                marginMm,
                              }));
                            }
                          }}
                        />
                        <span>mm</span>
                      </span>
                    </label>
                  </div>

                  <fieldset className="page-label-settings">
                    <legend>Header and footer</legend>

                    <label className="checkbox-field">
                      <input
                        type="checkbox"
                        checked={settings.pageLabels.showHeader}
                        onChange={(event) =>
                          updatePageLabels({
                            showHeader: event.currentTarget.checked,
                          })
                        }
                      />
                      <span>
                        <strong>Show header</strong>
                        <small>Reserve space above the writing rows.</small>
                      </span>
                    </label>

                    {settings.pageLabels.showHeader ? (
                      <div className="field-grid label-field-grid">
                        <label className="form-field" htmlFor="header-left">
                          <span>Header left</span>
                          <input
                            id="header-left"
                            type="text"
                            value={settings.pageLabels.headerLeft}
                            onChange={(event) =>
                              updatePageLabels({
                                headerLeft: event.currentTarget.value,
                              })
                            }
                          />
                        </label>
                        <label className="form-field" htmlFor="header-right">
                          <span>Header right</span>
                          <input
                            id="header-right"
                            type="text"
                            value={settings.pageLabels.headerRight}
                            onChange={(event) =>
                              updatePageLabels({
                                headerRight: event.currentTarget.value,
                              })
                            }
                          />
                        </label>
                        <label className="form-field">
                          <span>Header font size</span>
                          <span className="number-control">
                            <input
                              type="number"
                              min="2"
                              max="8"
                              step="0.5"
                              value={settings.pageLabels.headerFontSizeMm}
                              onChange={(event) => {
                                const headerFontSizeMm = Number(
                                  event.currentTarget.value,
                                );
                                if (
                                  headerFontSizeMm >= 2 &&
                                  headerFontSizeMm <= 8
                                ) {
                                  updatePageLabels({ headerFontSizeMm });
                                }
                              }}
                            />
                            <span>mm</span>
                          </span>
                        </label>
                      </div>
                    ) : null}

                    <label className="checkbox-field">
                      <input
                        type="checkbox"
                        checked={settings.pageLabels.showFooter}
                        onChange={(event) =>
                          updatePageLabels({
                            showFooter: event.currentTarget.checked,
                          })
                        }
                      />
                      <span>
                        <strong>Show footer</strong>
                        <small>Reserve space below the writing rows.</small>
                      </span>
                    </label>

                    {settings.pageLabels.showFooter ? (
                      <div className="field-grid footer-label-field">
                        <label className="form-field" htmlFor="footer-center">
                          <span>Footer center</span>
                          <input
                            id="footer-center"
                            type="text"
                            value={settings.pageLabels.footerCenter}
                            onChange={(event) =>
                              updatePageLabels({
                                footerCenter: event.currentTarget.value,
                              })
                            }
                          />
                        </label>
                        <label className="form-field">
                          <span>Footer font size</span>
                          <span className="number-control">
                            <input
                              type="number"
                              min="2"
                              max="8"
                              step="0.5"
                              value={settings.pageLabels.footerFontSizeMm}
                              onChange={(event) => {
                                const footerFontSizeMm = Number(
                                  event.currentTarget.value,
                                );
                                if (
                                  footerFontSizeMm >= 2 &&
                                  footerFontSizeMm <= 8
                                ) {
                                  updatePageLabels({ footerFontSizeMm });
                                }
                              }}
                            />
                            <span>mm</span>
                          </span>
                        </label>
                      </div>
                    ) : null}

                    <small className="token-hint">
                      Available placeholders: {"{fileName}"}, {"{page}"}, and{" "}
                      {"{pages}"}.
                    </small>
                  </fieldset>

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
                      <small>
                        Print at actual size and verify it with a ruler.
                      </small>
                    </span>
                  </label>
                </div>
              ) : null}
            </section>
          </div>

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
            <div className="preview-actions">
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
              <div className="zoom-controls" aria-label="Preview zoom">
                <button
                  type="button"
                  aria-label="Zoom out"
                  title="Zoom out"
                  disabled={previewZoom <= 50}
                  onClick={() =>
                    setPreviewZoom((current) => Math.max(50, current - 25))
                  }
                >
                  <ZoomIcon operation="out" />
                </button>
                <button
                  className="zoom-value"
                  type="button"
                  title="Fit worksheet to window"
                  onClick={() => setPreviewZoom(100)}
                >
                  {previewZoom === 100 ? "Fit" : `${previewZoom}%`}
                </button>
                <button
                  type="button"
                  aria-label="Zoom in"
                  title="Zoom in"
                  disabled={previewZoom >= 200}
                  onClick={() =>
                    setPreviewZoom((current) => Math.min(200, current + 25))
                  }
                >
                  <ZoomIcon operation="in" />
                </button>
              </div>
            </div>
          </div>

          <StatusMessages
            fontError={fontError}
            exportError={exportError}
            horizontalOverflowCount={
              worksheetDocument?.horizontalOverflowCount ?? 0
            }
            missingGlyphs={missingGlyphs}
          />

          <div className="preview-stage">
            {pageModel ? (
              <div className="preview-canvas" data-zoomed={previewZoom > 100}>
                <WorksheetPreview
                  model={pageModel}
                  fontSizeMm={fontSizeMm}
                  fontFamily={worksheetFont?.cssFamilyName ?? "Patrick Hand"}
                  textColor={textColor}
                  showCalibration={showCalibration}
                  zoomPercent={previewZoom}
                />
              </div>
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
                className="page-arrow-button"
                type="button"
                aria-label="Previous page"
                title="Previous page"
                disabled={currentPageIndex === 0}
                onClick={() =>
                  setActivePageIndex(Math.max(0, currentPageIndex - 1))
                }
              >
                <ChevronIcon direction="left" />
              </button>
              <span>
                Page {currentPageIndex + 1} of {worksheetDocument.pages.length}
              </span>
              <button
                className="page-arrow-button"
                type="button"
                aria-label="Next page"
                title="Next page"
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
                <ChevronIcon direction="right" />
              </button>
            </nav>
          ) : null}

          {worksheetFont ? (
            <div className="font-metrics">
              <div>
                <span className="eyebrow">Font alignment</span>
                <strong>{worksheetFont.familyName}</strong>
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
      {isDraggingFile ? (
        <div className="drop-overlay" aria-hidden="true">
          <div>
            <UploadIcon />
            <strong>Drop your text or font file</strong>
            <span>.txt, .ttf, and .otf files are supported</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatusMessages({
  fontError,
  exportError,
  horizontalOverflowCount,
  missingGlyphs,
}: {
  readonly fontError: string | null;
  readonly exportError: string | null;
  readonly horizontalOverflowCount: number;
  readonly missingGlyphs: readonly MissingGlyph[];
}) {
  const messages = [
    fontError,
    exportError,
    horizontalOverflowCount > 0
      ? `${horizontalOverflowCount} line${horizontalOverflowCount === 1 ? "" : "s"} could not fit within the printable width.`
      : null,
    missingGlyphs.length > 0
      ? `The selected font cannot display ${formatMissingGlyphs(missingGlyphs)}. Choose another font or remove those characters.`
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

function formatMissingGlyphs(missingGlyphs: readonly MissingGlyph[]): string {
  const visibleGlyphs = missingGlyphs
    .slice(0, 6)
    .map(({ character, codePoint }) => `"${character}" (${codePoint})`);
  const remainingCount = missingGlyphs.length - visibleGlyphs.length;

  return [
    ...visibleGlyphs,
    ...(remainingCount > 0 ? [`and ${remainingCount} more`] : []),
  ].join(", ");
}

function copyArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

function getFontMimeType(fileName: string): string {
  return fileName.toLowerCase().endsWith(".otf") ? "font/otf" : "font/ttf";
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

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 16V4m0 0L8 8m4-4 4 4M5 14v5h14v-5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function AccordionChevron({ expanded }: { readonly expanded: boolean }) {
  return (
    <svg
      className="accordion-chevron"
      viewBox="0 0 24 24"
      aria-hidden="true"
      data-expanded={expanded}
    >
      <path
        d="m7 9 5 5 5-5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function ZoomIcon({ operation }: { readonly operation: "in" | "out" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle
        cx="10.5"
        cy="10.5"
        r="5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d={
          operation === "in"
            ? "M10.5 8v5M8 10.5h5M15 15l4 4"
            : "M8 10.5h5M15 15l4 4"
        }
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function ChevronIcon({ direction }: { readonly direction: "left" | "right" }) {
  const path =
    direction === "left" ? "M14.5 5 8 12l6.5 7" : "M9.5 5 16 12l-6.5 7";

  return (
    <svg className="page-chevron-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.25"
      />
    </svg>
  );
}

export default App;
