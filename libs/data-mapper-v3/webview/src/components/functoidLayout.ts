import type { MapFunctoid } from '../../../src/model/mapModel';

const functoidWidth = 56;
const functoidHeight = 26;

export interface FunctoidLayoutOptions {
  horizontalPadding?: number;
  verticalPadding?: number;
}

export function fitFunctoidsToCanvas(
  functoids: MapFunctoid[],
  canvasWidth: number,
  canvasHeight: number,
  options: FunctoidLayoutOptions = {}
): boolean {
  if (functoids.length === 0 || !Number.isFinite(canvasWidth) || !Number.isFinite(canvasHeight)) {
    return false;
  }

  const horizontalPadding = options.horizontalPadding ?? 40;
  const verticalPadding = options.verticalPadding ?? 40;
  const availableXSpan = canvasWidth - horizontalPadding * 2 - functoidWidth;
  const availableYSpan = canvasHeight - verticalPadding * 2 - functoidHeight;
  if (availableXSpan < 0 || availableYSpan < 0) {
    return false;
  }

  const coordinates = functoids.map((functoid) => ({
    functoid,
    x: Number.isFinite(functoid.x) ? functoid.x : 0,
    y: Number.isFinite(functoid.y) ? functoid.y : 0,
  }));
  const minimumX = Math.min(...coordinates.map(({ x }) => x));
  const maximumX = Math.max(...coordinates.map(({ x }) => x));
  const minimumY = Math.min(...coordinates.map(({ y }) => y));
  const maximumY = Math.max(...coordinates.map(({ y }) => y));
  const minimumVisibleX = horizontalPadding + functoidWidth / 2;
  const maximumVisibleX = canvasWidth - horizontalPadding - functoidWidth / 2;
  const minimumVisibleY = verticalPadding + functoidHeight / 2;
  const maximumVisibleY = canvasHeight - verticalPadding - functoidHeight / 2;
  const isAlreadyVisible = coordinates.every(
    ({ x, y }) => x >= minimumVisibleX && x <= maximumVisibleX && y >= minimumVisibleY && y <= maximumVisibleY
  );
  if (isAlreadyVisible) {
    return false;
  }

  const xSpan = maximumX - minimumX;
  const ySpan = maximumY - minimumY;
  const scale = Math.min(1, xSpan > 0 ? availableXSpan / xSpan : 1, ySpan > 0 ? availableYSpan / ySpan : 1);
  const fittedXSpan = xSpan * scale;
  const fittedYSpan = ySpan * scale;
  const startX = minimumVisibleX + (availableXSpan - fittedXSpan) / 2;
  const startY = minimumVisibleY + (availableYSpan - fittedYSpan) / 2;

  for (const { functoid, x, y } of coordinates) {
    functoid.x = startX + (x - minimumX) * scale;
    functoid.y = startY + (y - minimumY) * scale;
  }
  return true;
}
