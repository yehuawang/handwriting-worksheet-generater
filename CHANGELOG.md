# Changelog

All notable changes to Handwriting Worksheet Generator are documented here.

## [Unreleased]

## [0.2.0] - 2026-07-25

### Added

- Versioned local settings and named reusable presets.
- Optional preset-scoped storage for worksheet text snapshots and uploaded fonts.
- Persistent and contextual drag-and-drop guidance for text and font files.
- Unified browser, Windows, and macOS application icons using the project logo.
- Branded NSIS/MSI installer artwork, stable upgrade identity, and complete bundle metadata.
- Fourteen OFL-licensed educational and regional Playwrite handwriting fonts.
- Reproducible Windows and macOS release workflow with optional platform signing, macOS notarization, checksums, provenance attestations, and draft release notes.
- Branded macOS DMG installer layout and release-maintainer documentation.

### Notes

- Windows and macOS installers in this release are unsigned. Platform security warnings are expected until trusted signing and notarization credentials are configured.

## [0.1.0] - 2026-07-25

### Added

- Import, edit, and drag-and-drop plain-text worksheet content.
- Preserve source line breaks, blank lines, indentation, and tabs.
- Wrap long text across printable rows and paginate complete worksheets.
- Choose bundled handwriting fonts or upload local TTF/OTF fonts.
- Configure guideline style, writing height, row spacing, text color, and practice rows.
- Configure US Letter or A4 paper, orientation, margins, headers, and footers.
- Preview every worksheet page with navigation and centered zoom controls.
- Export print-ready PDFs with embedded handwriting fonts.
- Warn about horizontal overflow and characters missing from the selected font.
- Use native open and save dialogs in the Windows desktop application.

### Notes

- Uploaded fonts are processed locally and remain available only for the current application session.
- Some highly connected or unusual script fonts may report inaccurate line widths because font shaping support remains planned work.
- Saved presets and additional desktop-release automation are planned for a future release.
