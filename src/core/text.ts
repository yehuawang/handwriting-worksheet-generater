export function normalizePlainText(text: string): string {
  return text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
}

export function expandTabs(line: string, tabWidth = 4): string {
  if (!Number.isInteger(tabWidth) || tabWidth <= 0) {
    throw new RangeError("tabWidth must be a positive integer.");
  }

  let column = 0;
  let result = "";

  for (const character of line) {
    if (character === "\t") {
      const spaces = tabWidth - (column % tabWidth);
      result += " ".repeat(spaces);
      column += spaces;
    } else {
      result += character;
      column += 1;
    }
  }

  return result;
}

export function getSourceLines(text: string, tabWidth = 4): readonly string[] {
  return normalizePlainText(text)
    .split("\n")
    .map((line) => expandTabs(line, tabWidth));
}
