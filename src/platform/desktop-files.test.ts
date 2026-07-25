import { describe, expect, it } from "vitest";

import { isDesktopRuntime } from "./desktop-files";

describe("desktop file integration", () => {
  it("uses the browser fallback outside Tauri", () => {
    expect(isDesktopRuntime()).toBe(false);
  });
});
