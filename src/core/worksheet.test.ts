import { describe, expect, it } from "vitest";

import {
  createWorksheetDocumentModel,
  DEFAULT_WORKSHEET_SETTINGS,
} from "./worksheet";

describe("worksheet document layout", () => {
  const measureText = (text: string) => text.length * 2;

  it("creates an example and practice row for every fitting source line", () => {
    const document = createWorksheetDocumentModel(
      "First\n  Second",
      DEFAULT_WORKSHEET_SETTINGS,
      measureText,
    );

    const page = document.pages[0];
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
    const document = createWorksheetDocumentModel(
      "This line is intentionally too wide",
      DEFAULT_WORKSHEET_SETTINGS,
      () => 500,
    );

    expect(document.horizontalOverflowCount).toBeGreaterThan(0);
    expect(document.pages[0].rows[0].overflowsHorizontally).toBe(true);
  });

  it("paginates every source line without splitting its practice row", () => {
    const source = Array.from(
      { length: 50 },
      (_, index) => `Line ${index}`,
    ).join("\n");
    const document = createWorksheetDocumentModel(
      source,
      DEFAULT_WORKSHEET_SETTINGS,
      measureText,
    );

    expect(document.pages.length).toBeGreaterThan(1);
    expect(document.pages.flatMap(({ rows }) => rows)).toHaveLength(100);
    for (const page of document.pages) {
      expect(page.pageNumber).toBeGreaterThan(0);
      if (page.rows.length > 0) {
        expect(page.rows[0].kind).toBe("example");
        expect(page.rows[page.rows.length - 1]?.kind).toBe("practice");
      }
    }
  });

  it("preserves a blank source line without adding a redundant practice row", () => {
    const document = createWorksheetDocumentModel(
      "First\n\nSecond",
      DEFAULT_WORKSHEET_SETTINGS,
      measureText,
    );

    expect(
      document.pages[0].rows.map(({ kind, text }) => ({ kind, text })),
    ).toEqual([
      { kind: "example", text: "First" },
      { kind: "practice", text: "" },
      { kind: "example", text: "" },
      { kind: "example", text: "Second" },
      { kind: "practice", text: "" },
    ]);
  });
});
