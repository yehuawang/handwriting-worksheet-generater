import { readFile } from "node:fs/promises";

const expectedVersion = process.argv[2]?.replace(/^v/, "");

if (!expectedVersion) {
  throw new Error(
    "Usage: node scripts/verify-release-version.mjs <version-or-tag>",
  );
}

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const tauriConfig = JSON.parse(
  await readFile("src-tauri/tauri.conf.json", "utf8"),
);
const cargoToml = await readFile("src-tauri/Cargo.toml", "utf8");
const cargoVersion = cargoToml.match(/^version\s*=\s*"([^"]+)"/m)?.[1];

const versions = {
  "package.json": packageJson.version,
  "src-tauri/tauri.conf.json": tauriConfig.version,
  "src-tauri/Cargo.toml": cargoVersion,
};

const mismatches = Object.entries(versions).filter(
  ([, version]) => version !== expectedVersion,
);

if (mismatches.length > 0) {
  const details = Object.entries(versions)
    .map(([file, version]) => `${file}: ${version ?? "missing"}`)
    .join("\n");
  throw new Error(
    `Release tag/version ${expectedVersion} does not match:\n${details}`,
  );
}

console.log(`Release version ${expectedVersion} is consistent.`);
