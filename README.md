# Handwriting Worksheet Generator

Handwriting Worksheet Generator is a desktop and web application for turning plain-text (`.txt`) files into printable handwriting-practice worksheets.

The application will preserve the source document's line breaks and indentation while allowing users to configure handwriting fonts, guideline styles, writing size, spacing, practice rows, paper layout, headers, and footers. Worksheets will be previewable and exportable as print-ready PDFs.

The project is currently under active development. It uses:

- React and TypeScript for the user interface.
- Vite for local web development and frontend builds.
- Tauri 2 and Rust for the desktop application.

See [PROJECT_PROPOSAL.md](./PROJECT_PROPOSAL.md) for the planned features, architecture, and delivery phases.

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

> User instructions will be added as the first deliverable product is developed.

<!--
Planned topics:
- Opening or importing a .txt file
- Editing source text
- Selecting or uploading a handwriting font
- Configuring guidelines and writing dimensions
- Adding practice rows
- Configuring paper, margins, headers, and footers
- Previewing the worksheet
- Exporting a PDF and printing at actual size
-->

## Project Status

The project is in its initial scaffolding and prototype phase. The current application confirms that the React, TypeScript, Vite, Rust, and Tauri development environment is working. Worksheet-generation features have not yet been implemented.

## License

A project license has not yet been selected.
