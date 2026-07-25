const DATABASE_NAME = "handwriting-worksheet-generator";
const DATABASE_VERSION = 1;
const ASSET_STORE_NAME = "preset-assets";

export interface StoredTextAsset {
  readonly id: string;
  readonly kind: "text";
  readonly fileName: string;
  readonly text: string;
  readonly updatedAt: string;
}

export interface StoredFontAsset {
  readonly id: string;
  readonly kind: "font";
  readonly fileName: string;
  readonly mimeType: string;
  readonly lastModified: number;
  readonly bytes: ArrayBuffer;
  readonly updatedAt: string;
}

type StoredAsset = StoredTextAsset | StoredFontAsset;

export function getPresetTextAssetId(presetId: string): string {
  return `preset:${presetId}:text`;
}

export function getPresetFontAssetId(presetId: string): string {
  return `preset:${presetId}:font`;
}

export async function saveTextAsset(
  asset: Omit<StoredTextAsset, "kind" | "updatedAt">,
): Promise<StoredTextAsset> {
  const storedAsset: StoredTextAsset = {
    ...asset,
    kind: "text",
    updatedAt: new Date().toISOString(),
  };
  await putAsset(storedAsset);
  return storedAsset;
}

export async function saveFontAsset(
  asset: Omit<StoredFontAsset, "kind" | "updatedAt">,
): Promise<StoredFontAsset> {
  const storedAsset: StoredFontAsset = {
    ...asset,
    kind: "font",
    updatedAt: new Date().toISOString(),
  };
  await putAsset(storedAsset);
  return storedAsset;
}

export async function loadTextAsset(
  id: string,
): Promise<StoredTextAsset | null> {
  const asset = await getAsset(id);
  return asset?.kind === "text" ? asset : null;
}

export async function loadFontAsset(
  id: string,
): Promise<StoredFontAsset | null> {
  const asset = await getAsset(id);
  return asset?.kind === "font" ? asset : null;
}

export async function deleteLocalAsset(id: string): Promise<void> {
  const database = await openDatabase();
  await completeRequest(
    database
      .transaction(ASSET_STORE_NAME, "readwrite")
      .objectStore(ASSET_STORE_NAME)
      .delete(id),
  );
}

export async function deletePresetAssets(presetId: string): Promise<void> {
  await Promise.all([
    deleteLocalAsset(getPresetTextAssetId(presetId)),
    deleteLocalAsset(getPresetFontAssetId(presetId)),
  ]);
}

async function putAsset(asset: StoredAsset): Promise<void> {
  const database = await openDatabase();
  await completeRequest(
    database
      .transaction(ASSET_STORE_NAME, "readwrite")
      .objectStore(ASSET_STORE_NAME)
      .put(asset),
  );
}

async function getAsset(id: string): Promise<StoredAsset | null> {
  const database = await openDatabase();
  const result = await completeRequest<StoredAsset | undefined>(
    database
      .transaction(ASSET_STORE_NAME, "readonly")
      .objectStore(ASSET_STORE_NAME)
      .get(id),
  );
  return result ?? null;
}

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(
      new Error("Local file storage is unavailable in this environment."),
    );
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(ASSET_STORE_NAME)) {
        request.result.createObjectStore(ASSET_STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Unable to open local file storage."));
  });
}

function completeRequest<TResult = undefined>(
  request: IDBRequest<TResult>,
): Promise<TResult> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(
        request.error ?? new Error("Unable to update local file storage."),
      );
  });
}
