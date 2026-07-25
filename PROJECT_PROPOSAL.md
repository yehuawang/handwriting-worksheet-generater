# Handwriting Worksheet Generator — Project Proposal

## 1. Project Summary

The Handwriting Worksheet Generator will convert a user-provided plain-text (`.txt`) file into a printable handwriting-practice worksheet. It will preserve line breaks, blank lines, spaces, and indentation while placing the text on configurable handwriting guidelines.

The first release will provide:

- A React web interface running on `localhost`.
- A Tauri desktop application that works offline.
- Live print preview and downloadable PDF output.
- A shared layout engine suitable for a future hosted website.

## 2. Goals

- Make worksheet creation simple for teachers, parents, students, and handwriting learners.
- Preserve the source text's visual structure.
- Keep letters accurately aligned with guidelines at every selected size.
- Provide useful presets while retaining advanced customization.
- Produce consistent, high-quality printable PDFs.
- Share code between desktop and web versions.

## 3. Proposed User Workflow

1. Open the application.
2. Upload a UTF-8 `.txt` file or paste/edit text.
3. Select a built-in handwriting font or upload a custom font.
4. Configure guideline style, size, spacing, colors, paper, and practice rows.
5. Configure the header and footer.
6. Review the paginated preview.
7. Download a PDF or print the worksheet.
8. Optionally save the settings as a reusable preset.

## 4. Functional Requirements

### Text input and formatting

- Accept `.txt` files and provide an editable text area.
- Preserve line breaks, blank lines, leading spaces, tabs, and repeated spaces.
- Use a configurable tab width, defaulting to four spaces.
- Handle UTF-8 and report unsupported encodings clearly.
- Support natural word wrapping and optionally one source line per worksheet row.
- Warn when text or indentation exceeds the printable width.

### Fonts

- Include several handwriting fonts with redistribution and embedding licenses.
- Display a visual font selector.
- Accept custom `.ttf`, `.otf`, `.woff`, and `.woff2` fonts where supported.
- Validate damaged or unsupported font files.
- Embed fonts in PDFs when their capabilities and licenses allow it.
- Warn that users are responsible for custom-font licensing.

### Guideline modes

Provide:

- Baseline only.
- Three lines: ascender, x-height, and baseline.
- Four lines: ascender, x-height, baseline, and descender.

Each guideline can support visibility, color, thickness, and solid/dashed style. Advanced settings may adjust each line's vertical position.

The interface will use these names:

- Ascender line: highest point of tall letters.
- X-height line: top of the main lowercase body.
- Baseline: where most letters sit.
- Descender line: lowest point of descending letters.

### Size and vertical geometry

- Offer writing heights such as 4, 5, 6, and 7 mm plus a custom value.
- Define writing height as the physical distance from ascender line to baseline.
- Scale the font and guideline geometry together.
- Preserve configured ascender, x-height, baseline, and descender proportions.
- Allow adjustment of x-height, ascender height, descender depth, and the gap between rows.
- Calculate documents in millimetres or PDF points rather than screen pixels.
- Offer a calibration print for checking actual physical output size.

### Example and practice rows

- Render source text as an example row.
- Allow configurable text color and a lighter traceable style.
- Allow zero or more blank guided practice rows beneath each example row.
- Keep each example and its practice rows together during pagination when possible.

### Page setup

- US Letter by default, plus A4 and additional sizes later.
- Portrait by default, with landscape available.
- Configurable top, bottom, left, and right margins.
- Validation preventing content outside the printable area.
- Millimetre and inch display units.

### Header and footer

Defaults:

- Header left: source file name.
- Header right: `Date: __________`.
- Footer center: `Page {page} of {pages}`.

Users can enable, disable, or edit these areas and use variables such as `{filename}`, `{date}`, `{page}`, and `{pages}`.

### Preview, export, and printing

- Live paginated preview matching final output.
- Preview zoom without changing physical print dimensions.
- Visible page boundaries, margins, headers, and footers.
- Warnings for overflow, missing glyphs, and invalid layout.
- Vector PDF export with embedded fonts where possible.
- Operating-system print dialog support.
- Deterministic pagination shared by preview, PDF, desktop, and web builds.

### Settings and presets

- Recommended defaults and reset functionality.
- Named reusable presets.
- Locally remembered recent settings.
- Later import/export of presets as JSON.

## 5. Recommended Defaults

- Paper: US Letter.
- Orientation: portrait.
- Margins: 12.7 mm (0.5 inch), subject to printer-safe validation.
- Guideline mode: four lines.
- Writing height: 6 mm from ascender line to baseline.
- Practice rows: one below each example row.
- Header: `{filename}` left and `Date: __________` right.
- Footer: `Page {page} of {pages}` centered.
- Guidelines: light gray or blue, with a dashed x-height line.
- Example text: medium gray for tracing or black for copying.

These defaults should be validated with educators.

## 6. Technical Approach

Use a shared TypeScript application:

- Frontend: React, TypeScript, and Vite.
- Desktop shell: Tauri 2.
- Layout engine: framework-independent TypeScript for measurement, wrapping, and pagination.
- Preview: SVG or HTML/SVG pages generated from a shared page model.
- PDF export: deterministic renderer driven by the same page model.
- Local development: Vite on `localhost`.
- Future website: deploy the web build while keeping file processing in-browser where practical.

Suggested structure:

```text
src/                    React application
src-tauri/              Tauri desktop shell
packages/
  worksheet-core/       Units, font metrics, layout, wrapping, pagination
  worksheet-renderer/   Preview and PDF rendering
assets/
  fonts/                Licensed fonts and license notices
tests/
  fixtures/             Sample text, fonts, and expected layouts
```

Core data:

- `SourceDocument`: text, file name, encoding, and tab policy.
- `TypographySettings`: font, color, and tracing style.
- `GuidelineSettings`: mode, ratios, colors, thickness, and dash patterns.
- `RowSettings`: writing height, row gap, and practice-row count.
- `PageSettings`: size, orientation, margins, header, and footer.
- `WorksheetPageModel`: positioned text, guideline segments, and page metadata.

Settings will be serializable and versioned so presets can be migrated.

## 7. Important Technical Considerations

### Font metrics and alignment

Different fonts have different ascender, descender, cap-height, and x-height metrics. The application must inspect each font, calculate a per-font scale and baseline offset, and permit manual adjustment for unusual custom fonts.

### Whitespace preservation

Plain text does not define a fixed tab width, while proportional fonts make spaces variable. The application must explicitly define tab behavior, measure with the selected font, preserve visual indentation, and apply a documented wrapping policy.

### Accurate physical output

Browser pixels are not reliable physical measurements. The page model will use millimetres or PDF points. PDF output is the print authority, with printing set to 100% or “actual size.”

### Licensing and privacy

Only appropriately licensed fonts will be bundled. Custom fonts and source text should be processed locally whenever possible, especially in the hosted version.

### Accessibility

Controls will be keyboard-accessible, labeled, grouped for screen readers, and designed with adequate UI contrast. The app will warn when worksheet colors may print poorly.

## 8. Non-Functional Requirements

- Offline desktop operation.
- Responsive generation for typical classroom documents.
- Graceful handling of invalid fonts and text files.
- Windows first; macOS and Linux may follow.
- Reproducible PDF output.
- Local processing unless an online feature is explicitly chosen.
- Automated unit, layout, and visual-regression tests.

## 9. Delivery Plan

### Phase 1 — Discovery and prototype

- Confirm guideline terminology and proportions.
- Select initial licensed fonts.
- Prototype font metrics and baseline alignment.
- Generate one physically accurate PDF page.
- Test printed dimensions.

Exit criterion: sample text prints at the intended size and aligns correctly.

### Phase 2 — Minimum viable product

- Text upload and editing.
- Whitespace and indentation preservation.
- Built-in and session-based custom fonts.
- One-, three-, and four-line guideline modes.
- Writing height and row spacing.
- Paper, orientation, margins, header, and footer.
- Paginated preview and PDF download.

Exit criterion: a user can produce a multi-page printable worksheet from a text file.

### Phase 3 — Desktop packaging

- Tauri native file dialogs and storage.
- Persistent settings and approved custom fonts.
- Windows installer/executable.
- Application metadata, icons, and versioning.

Exit criterion: a non-developer can run the app offline and export a worksheet.

### Phase 4 — Quality and convenience

- Named presets.
- More practice-row and trace options.
- Missing-character warnings.
- Calibration page.
- Accessibility pass.
- Visual-regression tests.
- Fixtures covering Unicode, tabs, long lines, and page breaks.

### Phase 5 — Hosted web release

- Keep processing in-browser where possible.
- Add hosting, privacy documentation, error monitoring, and security limits.
- Test current major browsers.

## 10. Testing Strategy

- Unit tests for units, line positions, font scaling, tabs, wrapping, and pagination.
- Golden tests comparing stable page models.
- Visual-regression tests comparing rendered worksheet pages.
- PDF checks for page dimensions, counts, placement, and embedded fonts.
- Manual print tests for Letter/A4, portrait/landscape, and multiple printers.
- Usability tests with teachers or parents.

## 11. Risks

| Risk                              | Mitigation                                                      |
| --------------------------------- | --------------------------------------------------------------- |
| Fonts align differently           | Read metrics, store per-font defaults, and allow manual offsets |
| Preview differs from print        | Use one physical-unit page model                                |
| Custom font cannot be embedded    | Validate and show an actionable warning                         |
| Long or indented lines overflow   | Offer wrapping policy and overflow warnings                     |
| Web and desktop behavior diverges | Share the layout and renderer                                   |
| Printer scaling alters dimensions | Provide calibration and actual-size instructions                |
| Font licensing prevents bundling  | Use open-licensed fonts and retain notices                      |
| Too many controls overwhelm users | Use presets with an expandable Advanced section                 |

## 12. Initial Definition of Done

- Uploaded or pasted text preserves line structure and indentation.
- Built-in and custom fonts can be selected.
- All initial guideline modes render correctly.
- Writing height and row spacing scale in physical units.
- Practice rows, page setup, header, and footer are configurable.
- Multi-page preview and PDF output agree.
- Printed output matches the selected physical measurements.
- The web app runs locally and the same codebase builds a Windows desktop executable.

## 13. Recommended First Decisions

1. Windows-only or multi-platform first desktop release.
2. Initial handwriting teaching style and guideline proportions.
3. Tracing, copying, or both.
4. Long-line wrapping behavior.
5. Whether hosted processing must remain entirely in-browser.
6. Fonts approved for redistribution and embedding.

The first engineering spike should test font alignment and PDF measurement accuracy because these are the highest-risk requirements.
