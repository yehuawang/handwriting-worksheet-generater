# ADR 0001: Shared Physical-Unit Layout Engine

- Status: Accepted
- Date: 2026-07-24

## Context

The application must render the same worksheet in a browser preview, a PDF, and a Tauri desktop application. Screen pixels and browser print behavior are not reliable physical measurements. Separate layout implementations would eventually disagree on line placement, wrapping, and pagination.

## Decision

The project will maintain a framework-independent TypeScript layout core.

- Millimetres are the canonical unit in the worksheet page model.
- PDF renderers convert millimetres to points only at their boundary.
- Browser previews scale the physical page model for display without changing its measurements.
- React components display and edit state but do not own layout calculations.
- Tauri provides native integration but does not duplicate worksheet geometry.
- Core calculations are deterministic and covered by unit tests.

## Consequences

Benefits:

- Preview, PDF, desktop, and future web deployments share layout behavior.
- Physical-size calculations can be tested without a browser.
- Renderers can evolve independently from document layout.

Costs:

- Font measurement must be normalized before entering the page model.
- Display code needs an explicit millimetre-to-screen scale.
- Renderer-specific features cannot silently alter pagination.

## Follow-up Decisions

Separate ADRs should define font-metric normalization, text wrapping, PDF rendering, and pagination once prototypes provide enough evidence.
