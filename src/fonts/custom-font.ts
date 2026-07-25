import { parse } from "opentype.js";
import type { Font } from "opentype.js";

import { extractFontMetrics } from "../core/font-metrics";
import type { LoadedWorksheetFont } from "./worksheet-fonts";

export const MAX_CUSTOM_FONT_BYTES = 10 * 1024 * 1024;
const SUPPORTED_FONT_EXTENSIONS = [".ttf", ".otf"] as const;

export async function loadCustomWorksheetFont(
  file: File,
): Promise<LoadedWorksheetFont> {
  validateCustomFontFile(file.name, file.size);

  const buffer = await file.arrayBuffer();
  let font: Font;

  try {
    font = parse(buffer.slice(0));
  } catch {
    throw new Error(
      "Unable to use this font. Choose a valid, non-corrupted TTF or OTF file.",
    );
  }

  const familyName = getFontFamilyName(font.names, file.name);
  const fontId = `custom-${file.lastModified}-${file.size}`;
  const cssFamilyName = `WorksheetCustom_${file.lastModified}_${file.size}`;
  const loadedFont: LoadedWorksheetFont = {
    id: fontId,
    familyName,
    cssFamilyName,
    source: "custom",
    bytes: new Uint8Array(buffer),
    font,
    metrics: extractFontMetrics(font),
  };

  try {
    await installPreviewFont(loadedFont);
  } catch {
    throw new Error(
      "The font was parsed, but the browser could not load it for preview.",
    );
  }

  return loadedFont;
}

export function validateCustomFontFile(name: string, size: number): void {
  const normalizedName = name.toLowerCase();
  const hasSupportedExtension = SUPPORTED_FONT_EXTENSIONS.some((extension) =>
    normalizedName.endsWith(extension),
  );

  if (!hasSupportedExtension) {
    throw new Error("Choose a font file with a .ttf or .otf extension.");
  }

  if (!Number.isFinite(size) || size <= 0) {
    throw new Error("The selected font file is empty.");
  }

  if (size > MAX_CUSTOM_FONT_BYTES) {
    throw new Error("The selected font is larger than the 10 MB limit.");
  }
}

async function installPreviewFont(font: LoadedWorksheetFont): Promise<void> {
  const previewFont = new FontFace(
    font.cssFamilyName,
    font.bytes.buffer.slice(
      font.bytes.byteOffset,
      font.bytes.byteOffset + font.bytes.byteLength,
    ),
  );

  await previewFont.load();
  document.fonts.add(previewFont);
}

function getFontFamilyName(fontNames: unknown, fileName: string): string {
  const names = fontNames as {
    readonly fontFamily?: Readonly<Record<string, string>>;
    readonly macintosh?: {
      readonly fontFamily?: Readonly<Record<string, string>>;
    };
    readonly windows?: {
      readonly fontFamily?: Readonly<Record<string, string>>;
    };
  };
  const localizedNames =
    names.fontFamily ??
    names.windows?.fontFamily ??
    names.macintosh?.fontFamily ??
    {};
  const name = localizedNames.en ?? Object.values(localizedNames)[0];
  return name?.trim() || fileName.replace(/\.[^/.]+$/, "") || "Custom font";
}
