import { describe, expect, it } from "vitest";

import {
  createWorksheetPageModel,
  DEFAULT_WORKSHEET_SETTINGS,
} from "./worksheet";

describe("single-page worksheet layout", () => {
  const measureText = (text: string) => text.length * 2;

  it("creates an example and practice row for every fitting source line", () => {
    const page = createWorksheetPageModel(
      "First\n  Second",
      DEFAULT_WORKSHEET_SETTINGS,
      measureText,
    );

    expect(page.rows).toHaveLength(4);
    expect(page.rows[0]).toMatchObject({
      kind: "example",
      text: "First",
      topYmm: 12.7,
      baselineYmm: 18.7,
    });
    expect(page.rows[2]).toMatchObject({
      kind: "example",
      text: "  Second",
    });
  });

  it("reports horizontal overflow", () => {
    const page = createWorksheetPageModel(
      "This line is intentionally too wide",
      DEFAULT_WORKSHEET_SETTINGS,
      () => 500,
    );

    expect(page.horizontalOverflowCount).toBe(1);
    expect(page.rows[0].overflowsHorizontally).toBe(true);
  });

  it("reports source lines omitted from the first page", () => {
    const source = Array.from(
      { length: 50 },
      (_, index) => `Line ${index}`,
    ).join("\n");
    const page = createWorksheetPageModel(
      source,
      DEFAULT_WORKSHEET_SETTINGS,
      measureText,
    );

    expect(page.omittedSourceLineCount).toBeGreaterThan(0);
  });

  it("preserves a blank source line without adding a redundant practice row", () => {
    const page = createWorksheetPageModel(
      "First\n\nSecond",
      DEFAULT_WORKSHEET_SETTINGS,
      measureText,
    );

    expect(page.rows.map(({ kind, text }) => ({ kind, text }))).toEqual([
      { kind: "example", text: "First" },
      { kind: "practice", text: "" },
      { kind: "example", text: "" },
      { kind: "example", text: "Second" },
      { kind: "practice", text: "" },
    ]);
  });
});
