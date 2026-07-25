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

export interface WrappedTextLine {
  readonly text: string;
  readonly continuationIndex: number;
}

export function wrapTextLine(
  line: string,
  maximumWidth: number,
  measureText: (text: string) => number,
): readonly WrappedTextLine[] {
  if (!Number.isFinite(maximumWidth) || maximumWidth <= 0) {
    throw new RangeError("maximumWidth must be greater than zero.");
  }

  if (line.length === 0 || measureText(line) <= maximumWidth) {
    return [{ text: line, continuationIndex: 0 }];
  }

  const indentation = line.match(/^\s*/)?.[0] ?? "";
  const content = line.slice(indentation.length);

  if (content.length === 0) {
    return [{ text: line, continuationIndex: 0 }];
  }

  const wrapped: WrappedTextLine[] = [];
  let remaining = content;

  while (remaining.length > 0) {
    const prefix = indentation;
    const fittingLength = findFittingPrefixLength(
      prefix,
      remaining,
      maximumWidth,
      measureText,
    );

    if (fittingLength >= remaining.length) {
      wrapped.push({
        text: `${prefix}${remaining}`,
        continuationIndex: wrapped.length,
      });
      break;
    }

    const breakLength = findPreferredBreakLength(remaining, fittingLength);
    const segment = remaining.slice(0, breakLength).trimEnd();
    wrapped.push({
      text: `${prefix}${segment}`,
      continuationIndex: wrapped.length,
    });
    remaining = remaining.slice(breakLength).trimStart();
  }

  return wrapped;
}

function findFittingPrefixLength(
  prefix: string,
  content: string,
  maximumWidth: number,
  measureText: (text: string) => number,
): number {
  let low = 0;
  let high = content.length;

  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (measureText(`${prefix}${content.slice(0, middle)}`) <= maximumWidth) {
      low = middle;
    } else {
      high = middle - 1;
    }
  }

  return Math.max(1, low);
}

function findPreferredBreakLength(
  content: string,
  fittingLength: number,
): number {
  const candidate = content.slice(0, fittingLength);

  for (let index = candidate.length - 1; index >= 0; index -= 1) {
    if (/\s/.test(candidate[index])) {
      return index + 1;
    }
  }

  return fittingLength;
}
