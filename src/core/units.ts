/**
 * Physical-unit conversion helpers.
 *
 * Worksheet layout is calculated in millimetres. PDF renderers can convert the
 * final page model to points without relying on browser pixels or display DPI.
 */
export const MILLIMETRES_PER_INCH = 25.4;
export const POINTS_PER_INCH = 72;

export function millimetresToPoints(millimetres: number): number {
  assertFiniteNumber(millimetres, "millimetres");
  return (millimetres / MILLIMETRES_PER_INCH) * POINTS_PER_INCH;
}

export function pointsToMillimetres(points: number): number {
  assertFiniteNumber(points, "points");
  return (points / POINTS_PER_INCH) * MILLIMETRES_PER_INCH;
}

export function inchesToMillimetres(inches: number): number {
  assertFiniteNumber(inches, "inches");
  return inches * MILLIMETRES_PER_INCH;
}

function assertFiniteNumber(value: number, name: string): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} must be a finite number.`);
  }
}
