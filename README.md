# Handwriting Worksheet Generator

Handwriting Worksheet Generator is a desktop and web application for turning plain-text (`.txt`) files into printable handwriting-practice worksheets.

The application will preserve the source document's line breaks and indentation while allowing users to configure handwriting fonts, guideline styles, writing size, spacing, practice rows, paper layout, headers, and footers. Worksheets will be previewable and exportable as print-ready PDFs.

The project is currently under active development. It uses:

- React and TypeScript for the user interface.
- Vite for local web development and frontend builds.
- Tauri 2 and Rust for the desktop application.

See [PROJECT_PROPOSAL.md](./PROJECT_PROPOSAL.md) for the planned features, architecture, and delivery phases.

Development priorities are tracked in [ROADMAP.md](./ROADMAP.md). Ideas, bug reports, documentation improvements, teaching experience, and code contributions are welcome.

## Project Principles

- **Useful in real life:** The project began as a response to handwriting-workbook needs that existing services did not meet.
- **Free and open source:** Anyone may use, study, modify, and share the software under the MIT License.
- **Local and private:** Worksheet text and custom fonts are processed locally. The application currently contains no telemetry or advertising.
- **Print accurate:** Printable geometry is calculated in physical units rather than screen pixels.
- **Community friendly:** Educators, learners, designers, developers, and accessibility specialists are welcome to shape the project.

## Development Setup

### Prerequisites

Install the following before starting:

- [Git](https://git-scm.com/)
- [Node.js LTS](https://nodejs.org/)
- [Rust](https://www.rust-lang.org/tools/install)
- The [Tauri system prerequisites](https://v2.tauri.app/start/prerequisites/) for your operating system

For Windows desktop development, the Tauri prerequisites include:

- Microsoft C++ Build Tools with the **Desktop development with C++** workload.
- A recent Windows 10 or Windows 11 SDK.
- Microsoft Edge WebView2 Runtime.

For macOS desktop development, install the Xcode Command Line Tools:

```bash
xcode-select --install
```

Recommended VS Code extensions:

- [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
- [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

### Start After Cloning

Clone the repository and enter the project directory:

```bash
git clone <repository-url>
cd HandwritingWorksheetGenerator
```

Install the JavaScript dependencies:

```bash
npm install
```

Alternatively, use the included VS Code Dev Container for browser and worksheet-core development. Tauri desktop development and platform-specific builds should still run on the host operating system.

Run the web application:

```bash
npm run dev
```

Vite will print the local address in the terminal. By default, it is:

```text
http://localhost:1420
```

Run the desktop application:

```bash
npm run tauri dev
```

The first desktop launch may take several minutes while Rust compiles the native dependencies.

### Useful Commands

```bash
# Run the web development server
npm run dev

# Type-check and build the web application
npm run build

# Preview the production web build
npm run preview

# Run the Tauri desktop application in development mode
npm run tauri dev

# Build the desktop application and platform installers
npm run tauri build

# Check the Rust backend without producing an installer
cargo check --manifest-path src-tauri/Cargo.toml
```

Desktop application bundles are platform-specific. Build Windows installers on Windows and macOS application bundles on macOS.

## Using the Software

The current printable prototype supports multi-page worksheets:

1. Start the web or desktop development application.
2. Select **Import .txt** to load a plain-text file, or edit the text directly.
3. Choose baseline-only, three-line, or four-line guidelines.
4. Choose a bundled handwriting font or upload a local TTF/OTF font, then set the writing height, gap between rows, example color, and optional practice rows.
5. Choose US Letter or A4 in portrait or landscape orientation.
6. Review each page with the preview navigation.
7. Select **Download PDF** to export the complete worksheet.
8. Print the PDF using **Actual size** or **100% scale**.
9. If the calibration mark is enabled, verify that it measures exactly 50 mm with a ruler.

The prototype preserves line breaks, blank lines, leading spaces, and tabs. Long lines wrap within the printable area, retaining their indentation, and example/practice row pairs stay together across page boundaries. Bundled and uploaded fonts use their own measured geometry in the preview and exported PDF. Uploaded fonts remain local to the current application session. Headers, footers, and saved presets remain planned work.

## Project Status

The printable prototype is implemented. It imports text, calculates font-aware guideline geometry, provides a paginated live preview, and exports a physically sized multi-page PDF with an embedded open-licensed handwriting font. The remaining product controls are under development.

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request. By participating, you agree to follow the [Code of Conduct](./CODE_OF_CONDUCT.md).

- Use GitHub issue forms for bugs, feature proposals, and questions.
- Report vulnerabilities privately according to [SECURITY.md](./SECURITY.md).
- Review [GOVERNANCE.md](./GOVERNANCE.md) for the project's decision-making model.
- Read [PRIVACY.md](./PRIVACY.md) before proposing analytics or hosted processing.

## Who Is Using It?

Open-source downloads and clones may be anonymous, so the project cannot identify every user. If this tool is useful to you, your classroom, or your organization, you may voluntarily share a non-sensitive use case in [USERS.md](./USERS.md) through the **Share your use** GitHub issue form.

Registration is never required, and the application does not send usage telemetry.

## License

This project is available under the [MIT License](./LICENSE). It permits personal, educational, open-source, and commercial use, including modification and redistribution, provided the license notice is retained.

Additional public credit and adoption reports are appreciated but not required. See [ATTRIBUTION.md](./ATTRIBUTION.md).
