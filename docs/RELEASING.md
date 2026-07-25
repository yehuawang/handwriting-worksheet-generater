# Release Process

Desktop releases are built from version tags by `.github/workflows/release.yml`. The workflow validates the release version, runs the full project checks, builds Windows x64 plus macOS Apple Silicon and Intel installers, creates SHA-256 checksums and GitHub provenance attestations, and opens a draft GitHub release with generated notes.

## One-time repository setup

GitHub Actions must have permission to create releases and attestations. The workflow requests only the permissions needed by each job.

### Windows signing secrets

Signed Windows releases require an Authenticode code-signing certificate exported as a password-protected PFX:

- `WINDOWS_CERTIFICATE`: base64-encoded PFX contents.
- `WINDOWS_CERTIFICATE_PASSWORD`: PFX export password.

When these secrets are absent, the workflow still produces unsigned Windows installers for testing. Public unsigned installers can trigger Microsoft Defender SmartScreen warnings. The workflow imports the certificate into the temporary runner certificate store, signs with SHA-256, and uses DigiCert's timestamp service. Certificate files and passwords must never be committed.

### macOS signing and notarization secrets

Public macOS distribution requires an Apple Developer Program membership and a Developer ID Application certificate:

- `APPLE_CERTIFICATE`: base64-encoded Developer ID Application `.p12` contents.
- `APPLE_CERTIFICATE_PASSWORD`: certificate export password.
- `KEYCHAIN_PASSWORD`: temporary CI keychain password.
- `APPLE_ID`: Apple account email used for notarization.
- `APPLE_PASSWORD`: Apple app-specific password, not the account password.
- `APPLE_TEAM_ID`: Apple Developer team identifier.

When the certificate is absent, the workflow uses ad-hoc signing so test builds can be opened without macOS treating the bundle as structurally unsigned. Ad-hoc signing does not establish a trusted developer identity or replace notarization.

## Creating a release

1. Update the same semantic version in `package.json`, `src-tauri/Cargo.toml`, and `src-tauri/tauri.conf.json`.
2. Run `npm run release:verify -- vX.Y.Z` and the checks listed in `docs/DISTRIBUTION.md`.
3. Update `CHANGELOG.md`, commit the release preparation, and create an annotated `vX.Y.Z` tag.
4. Push the commit and tag. The tag starts the Desktop release workflow.
5. Inspect the generated draft release and test every target-platform installer before publishing it.

The workflow can also be run manually for an existing tag. It deliberately creates a draft rather than publishing automatically so a human remains responsible for final release approval.

## Verifying artifacts

Compare a downloaded file with `CHECKSUMS-SHA256.txt`:

```bash
sha256sum --check CHECKSUMS-SHA256.txt
```

Verify GitHub build provenance:

```bash
gh attestation verify "path/to/installer" --repo yehuawang/handwriting-worksheet-generater
```

Verify Windows Authenticode signatures in PowerShell:

```powershell
Get-AuthenticodeSignature "path\to\installer.exe" | Format-List
```

Verify a signed and notarized macOS application on a Mac:

```bash
codesign --verify --deep --strict --verbose=2 "Handwriting Worksheet Generator.app"
spctl --assess --type execute --verbose=2 "Handwriting Worksheet Generator.app"
xcrun stapler validate "Handwriting Worksheet Generator.app"
```

Checksums detect file changes, attestations establish workflow provenance, and platform signatures establish publisher identity. None of these alone guarantees that an artifact is vulnerability-free.
