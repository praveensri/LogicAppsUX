import type { MapFunctoid } from '../src/model/mapModel';
import { fitFunctoidsToCanvas } from '../webview/src/components/functoidLayout';

function createFunctoid(id: string, x: number, y: number): MapFunctoid {
  return {
    id,
    functoidId: 1,
    category: 'String',
    name: id,
    x,
    y,
    inputLinks: [],
    outputLinks: [],
    parameters: [],
  };
}

describe('fitFunctoidsToCanvas', () => {
  test('fits extreme BizTalk coordinates within both canvas dimensions', () => {
    const functoids = [
      createFunctoid('top-left', 2334, -1964),
      createFunctoid('middle', 2390, 124),
      createFunctoid('bottom-right', 2572, 160),
    ];

    expect(fitFunctoidsToCanvas(functoids, 640, 480)).toBe(true);

    for (const functoid of functoids) {
      expect(functoid.x).toBeGreaterThanOrEqual(68);
      expect(functoid.x).toBeLessThanOrEqual(572);
      expect(functoid.y).toBeGreaterThanOrEqual(53);
      expect(functoid.y).toBeLessThanOrEqual(427);
    }
    expect(functoids[0].x).toBeLessThan(functoids[1].x);
    expect(functoids[1].x).toBeLessThan(functoids[2].x);
    expect(functoids[0].y).toBeLessThan(functoids[1].y);
    expect(functoids[1].y).toBeLessThan(functoids[2].y);
  });

  test('does not move an already visible layout', () => {
    const functoids = [createFunctoid('left', 120, 100), createFunctoid('right', 320, 220)];
    const original = functoids.map(({ x, y }) => ({ x, y }));

    expect(fitFunctoidsToCanvas(functoids, 640, 480)).toBe(false);
    expect(functoids.map(({ x, y }) => ({ x, y }))).toEqual(original);
  });
});
