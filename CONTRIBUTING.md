# Contributing

Thank you for helping make handwriting-practice tools more useful and accessible. Contributions of code, tests, documentation, design feedback, teaching experience, and reproducible bug reports are welcome.

Please read our [Code of Conduct](./CODE_OF_CONDUCT.md) before participating.

## Before You Start

- Search existing issues before opening a new one.
- For bugs, include reproducible steps and relevant environment details.
- For a small, well-defined fix, feel free to open a pull request.
- For substantial features or architecture changes, open a feature proposal first so the approach can be discussed before significant work begins.
- Security vulnerabilities must be reported privately as described in [SECURITY.md](./SECURITY.md).
- Real-world users may optionally share a non-sensitive use case for [USERS.md](./USERS.md).

## Development Setup

Follow the prerequisites and cloning instructions in [README.md](./README.md). Then install dependencies:

```bash
npm install
```

Start the browser application:

```bash
npm run dev
```

Start the desktop application:

```bash
npm run tauri dev
```

## Development Workflow

1. Fork the repository.
2. Create a focused branch from the default branch:

   ```bash
   git switch -c feat/short-description
   ```

3. Make a small, cohesive change.
4. Add or update tests and documentation.
5. Run the complete local check:

   ```bash
   npm run check
   npm run pdf:sample
   cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
   cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
   cargo check --manifest-path src-tauri/Cargo.toml
   ```

6. Push the branch and open a pull request.

Good branch prefixes include `feat/`, `fix/`, `docs/`, `test/`, and `chore/`.

## Code Guidelines

- Keep worksheet calculations independent of React and Tauri when possible.
- Use millimetres as the canonical physical unit inside the worksheet page model.
- Convert to PDF points only at renderer boundaries.
- Avoid using screen pixels for printable geometry.
- Prefer immutable inputs and deterministic functions in `src/core`.
- Add unit tests for layout rules, conversions, wrapping, and pagination.
- Keep UI components accessible by keyboard and assistive technology.
- Preserve the local-first privacy guarantees in [PRIVACY.md](./PRIVACY.md).
- Explain non-obvious design decisions in an Architecture Decision Record under `docs/architecture`.

Formatting and linting are automated:

```bash
npm run format
npm run lint
```

Rust code must pass `rustfmt` and `clippy`.

## Pull Requests

A useful pull request:

- Has a clear title and describes the user or developer problem.
- Links the relevant issue when one exists.
- Stays focused on one change.
- Includes tests for changed behavior.
- Updates documentation when behavior or setup changes.
- Includes screenshots for visible UI changes.
- Passes all automated checks.

Maintainers may ask for a proposal to be split into smaller pull requests. Review focuses on correctness, accessibility, print accuracy, maintainability, and compatibility with both web and desktop builds.

## Licensing

By submitting a contribution, you agree that it may be distributed under this repository's [MIT License](./LICENSE).
