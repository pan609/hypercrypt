import { describe, expect, it } from 'vitest';
import { atkinsonDitherGrayscale, atkinsonDitherRgba } from '../../src/engine/atkinson';
import {
  BITMAP_SIZE,
  createBlankBitmap,
  decodeBitmapRle,
  drawLine,
  drawRect,
  encodeBitmapRle,
  floodFill,
} from '../../src/engine/bitmap';
import { CARD_WIDTH } from '../../src/engine/types';

describe('1-Bit Bitmap RLE & Paint Primitives', () => {
  it('encodes blank bitmap to empty string and decodes cleanly', () => {
    const blank = createBlankBitmap();
    expect(encodeBitmapRle(blank)).toBe('');
    const decoded = decodeBitmapRle('');
    expect(decoded.length).toBe(BITMAP_SIZE);
    expect(decoded.every((b) => b === 0)).toBe(true);
  });

  it('losslessly round-trips drawn lines, rects, and flood fill', () => {
    const bits = createBlankBitmap();
    drawRect(bits, 10, 10, 40, 40, false);
    floodFill(bits, 20, 20, 'stipple50');
    drawLine(bits, 0, 0, 100, 50, 1, 1);

    const rle = encodeBitmapRle(bits);
    expect(rle.startsWith('rle1:')).toBe(true);
    expect(rle.length).toBeLessThan(8000);

    const restored = decodeBitmapRle(rle);
    expect(restored.length).toBe(bits.length);
    for (let i = 0; i < bits.length; i++) {
      expect(restored[i]).toBe(bits[i]);
    }
    // Check an interior filled stipple pixel
    expect(restored[20 * CARD_WIDTH + 20]).toBe(1);
    expect(restored[20 * CARD_WIDTH + 21]).toBe(0);
  });
});

describe('Bill Atkinson 1-Bit Dithering', () => {
  it('produces airy deterministic stipple for mid-gray unlike hard threshold', () => {
    const w = 32;
    const h = 32;
    const midGray = new Float32Array(w * h).fill(120);

    const atkinson = atkinsonDitherGrayscale(midGray, w, h, { mode: 'atkinson' });
    const threshold = atkinsonDitherGrayscale(midGray, w, h, { mode: 'threshold' });

    const sumAtk = atkinson.reduce((acc, v) => acc + v, 0);
    const sumThr = threshold.reduce((acc, v) => acc + v, 0);

    // Threshold turns every 120 pixel solid ink (100% black); Atkinson mixes black & white pixels
    expect(sumThr).toBe(w * h);
    expect(sumAtk).toBeGreaterThan(w * h * 0.25);
    expect(sumAtk).toBeLessThan(w * h * 0.8);
  });

  it('handles RGBA alpha blending onto light paper', () => {
    const rgba = new Uint8ClampedArray([
      0, 0, 0, 255,       // solid black -> ink (1)
      0, 0, 0, 0,         // transparent -> blended to white -> paper (0)
      255, 255, 255, 255, // solid white -> paper (0)
      255, 255, 255, 255,
    ]);
    const out = atkinsonDitherRgba(rgba, 2, 2, { mode: 'threshold' });
    expect(Array.from(out)).toEqual([1, 0, 0, 0]);
  });
});
