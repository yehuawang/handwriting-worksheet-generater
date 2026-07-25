# Desktop Distribution

Desktop bundles must be built on their target operating system. The application version is defined consistently in `package.json`, `src-tauri/Cargo.toml`, and `src-tauri/tauri.conf.json`.

## Application identity

- Product name: Handwriting Worksheet Generator
- Bundle identifier: `com.handwritingworksheet.generator`
- Publisher metadata: Yehua Wang
- License: MIT
- Category: Education
- Canonical project page: <https://github.com/yehuawang/handwriting-worksheet-generater>

The browser favicon, Windows executable and installer icons, Windows tile assets, and macOS `.icns` are generated from `public/favicon.svg`. Run the following command after intentionally changing the source artwork:

```bash
npm run tauri icon public/brand-mark.svg
```

The MSI upgrade code is pinned in `src-tauri/tauri.conf.json`. It must not change between releases, or Windows may install updates as duplicate applications.

## Windows bundles

Run:

```bash
npm run tauri build
```

This produces an NSIS setup executable, an MSI installer, and the unpackaged executable under `src-tauri/target/release`. The NSIS and MSI interfaces use the branded artwork in `src-tauri/installer-assets`.

Current development builds are unsigned. Windows SmartScreen may therefore identify the publisher as unknown or warn that the application is uncommon. Public trust warnings cannot be removed by changing installer text or icons.

Before publishing signed Windows builds:

1. Obtain an organization-validation code-signing certificate or configure Azure Artifact Signing.
2. Store certificate material only in the operating-system certificate store or encrypted GitHub Actions secrets.
3. Configure Tauri's Windows signing fields or a supported signing command.
4. Use SHA-256 and a trusted timestamp server.
5. Verify signatures on the executable, NSIS installer, and MSI.
6. Publish SHA-256 checksums with every release.

SmartScreen reputation is controlled by Microsoft and may take time to establish even after signing. The project must not claim that signing guarantees the absence of all warnings.

## macOS bundles

Build macOS artifacts on macOS. The generated `src-tauri/icons/icon.icns` already contains the approved application artwork.

For public distribution outside the Mac App Store:

1. Join the Apple Developer Program.
2. Create and securely install a Developer ID Application certificate.
3. Build with hardened runtime and the Developer ID signing identity.
4. Submit the application or DMG to Apple's notarization service.
5. Staple the notarization ticket to the distributed artifact.
6. Test installation on a clean Mac without development certificates.

Ad-hoc signing can support development builds but does not remove Gatekeeper trust prompts. Apple credentials, certificates, private keys, and app-specific passwords must never be committed to the repository.

## Release verification

Every release candidate should pass:

- `npm run check`
- `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check`
- `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings`
- A clean target-platform bundle build
- Installation, launch, PDF export, uninstall, and upgrade testing
- Signature and checksum verification when signing is configured
