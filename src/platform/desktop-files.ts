import { isTauri } from "@tauri-apps/api/core";

export interface OpenedTextDocument {
  readonly fileName: string;
  readonly text: string;
}

export function isDesktopRuntime(): boolean {
  return isTauri();
}

export async function openDesktopTextDocument(): Promise<OpenedTextDocument | null> {
  const [{ open }, { readTextFile }] = await Promise.all([
    import("@tauri-apps/plugin-dialog"),
    import("@tauri-apps/plugin-fs"),
  ]);
  const path = await open({
    multiple: false,
    directory: false,
    filters: [{ name: "Plain text", extensions: ["txt"] }],
  });

  if (!path) {
    return null;
  }

  return {
    fileName: getPathFileName(path),
    text: await readTextFile(path),
  };
}

export async function saveDesktopPdf(
  bytes: Uint8Array,
  suggestedFileName: string,
): Promise<boolean> {
  const [{ save }, { writeFile }] = await Promise.all([
    import("@tauri-apps/plugin-dialog"),
    import("@tauri-apps/plugin-fs"),
  ]);
  const path = await save({
    defaultPath: suggestedFileName,
    filters: [{ name: "PDF document", extensions: ["pdf"] }],
  });

  if (!path) {
    return false;
  }

  await writeFile(path, bytes);
  return true;
}

function getPathFileName(path: string): string {
  const pathSegments = path.split(/[\\/]/).filter(Boolean);
  return pathSegments[pathSegments.length - 1] ?? "worksheet.txt";
}
