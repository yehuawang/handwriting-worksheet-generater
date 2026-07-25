# ADR 0002: Local-First Processing and No Default Telemetry

- Status: Accepted
- Date: 2026-07-24

## Context

Worksheet source files may contain names, educational content, or other personal information. Custom fonts may also be licensed files that should not be uploaded unnecessarily. The project would like to understand adoption, but an open-source desktop application cannot reliably identify every user without introducing tracking infrastructure and privacy obligations.

## Decision

- Worksheet text, file names, settings, and custom fonts are processed locally by default.
- The application contains no telemetry, analytics, advertising, tracking pixels, or project-operated user accounts.
- Adoption is measured through aggregate GitHub signals and voluntary public reports.
- No feature may attempt to identify individual installations or users.
- Any future analytics proposal must be public, disabled by default, explicitly opt-in, documented before release, and incapable of collecting document contents.

## Consequences

Benefits:

- Users can work with sensitive material without sending it to the project.
- The desktop application can function offline.
- The privacy model is straightforward to explain and audit.
- Community adoption examples are based on consent.

Costs:

- The project cannot know its exact active-user count.
- Product decisions must rely on voluntary feedback, testing, and coarse repository metrics.
- Maintainers must describe download and clone statistics precisely rather than treating them as users.

Hosted features may require a later ADR and privacy review if they introduce server-side processing.
