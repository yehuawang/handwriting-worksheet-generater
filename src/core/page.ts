import { inchesToMillimetres } from "./units";

export interface PageSize {
  readonly widthMm: number;
  readonly heightMm: number;
}

export type PaperSizeName = "letter" | "a4";
export type PageOrientation = "portrait" | "landscape";

export const PAPER_SIZES: Readonly<Record<PaperSizeName, PageSize>> = {
  letter: {
    widthMm: inchesToMillimetres(8.5),
    heightMm: inchesToMillimetres(11),
  },
  a4: {
    widthMm: 210,
    heightMm: 297,
  },
};

export function getOrientedPageSize(
  paper: PaperSizeName,
  orientation: PageOrientation,
): PageSize {
  const size = PAPER_SIZES[paper];

  return orientation === "portrait"
    ? { ...size }
    : { widthMm: size.heightMm, heightMm: size.widthMm };
}
