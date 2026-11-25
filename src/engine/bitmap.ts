import { CARD_HEIGHT, CARD_WIDTH } from './types';

export const BITMAP_SIZE = CARD_WIDTH * CARD_HEIGHT;

export type PaintPattern = 'solid' | 'stipple50' | 'diagonal' | 'checker';

export function createBlankBitmap(): Uint8Array {
  return new Uint8Array(BITMAP_SIZE);
}

/**
 * Lossless ASCII Run-Length Encoding for 512x342 1-bit monochrome bitmaps.
 * Format: alternating counts starting from 0-bits (paper), separated by commas,
 * prefixed with `rle1:`. Empty string represents a completely blank canvas.
 */
export function encodeBitmapRle(bits: Uint8Array): string {
  let hasInk = false;
  for (let i = 0; i < bits.length; i++) {
    if (bits[i] !== 0) {
      hasInk = true;
      break;
    }
  }
  if (!hasInk) return '';

  const runs: number[] = [];
  let current = 0;
  let count = 0;

  for (let i = 0; i < BITMAP_SIZE; i++) {
    const bit = bits[i] ? 1 : 0;
    if (bit === current) {
      count++;
    } else {
      runs.push(count);
      current = bit;
      count = 1;
    }
  }
  runs.push(count);
  return `rle1:${runs.join(',')}`;
}

export function decodeBitmapRle(rle: string): Uint8Array {
  const bits = createBlankBitmap();
  if (!rle || !rle.startsWith('rle1:')) return bits;

  const parts = rle.slice(5).split(',');
  let pos = 0;
  let current = 0;
  for (let i = 0; i < parts.length && pos < BITMAP_SIZE; i++) {
    const run = Number.parseInt(parts[i], 10);
    if (!Number.isFinite(run) || run < 0) break;
    const end = Math.min(BITMAP_SIZE, pos + run);
    if (current === 1) {
      bits.fill(1, pos, end);
    }
    pos = end;
    current = 1 - current;
  }
  return bits;
}

export function samplePattern(x: number, y: number, pattern: PaintPattern): 0 | 1 {
  switch (pattern) {
    case 'solid':
      return 1;
    case 'stipple50':
      return (x + y) % 2 === 0 ? 1 : 0;
    case 'diagonal':
      return (x + y) % 4 === 0 ? 1 : 0;
    case 'checker':
      return ((x >> 1) + (y >> 1)) % 2 === 0 ? 1 : 0;
  }
}

export function setPixel(bits: Uint8Array, x: number, y: number, value: 0 | 1): void {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  if (ix < 0 || ix >= CARD_WIDTH || iy < 0 || iy >= CARD_HEIGHT) return;
  bits[iy * CARD_WIDTH + ix] = value;
}

export function drawBrush(
  bits: Uint8Array,
  cx: number,
  cy: number,
  radius: number,
  ink: 0 | 1,
  pattern: PaintPattern = 'solid',
): void {
  const r = Math.max(0, Math.floor(radius));
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy <= r * r + r) {
        const px = Math.floor(cx + dx);
        const py = Math.floor(cy + dy);
        if (ink === 0) {
          setPixel(bits, px, py, 0);
        } else if (samplePattern(px, py, pattern) === 1) {
          setPixel(bits, px, py, 1);
        }
      }
    }
  }
}

export function drawLine(
  bits: Uint8Array,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  radius = 0,
  ink: 0 | 1 = 1,
  pattern: PaintPattern = 'solid',
): void {
  let ix0 = Math.floor(x0);
  let iy0 = Math.floor(y0);
  const ix1 = Math.floor(x1);
  const iy1 = Math.floor(y1);

  const dx = Math.abs(ix1 - ix0);
  const dy = Math.abs(iy1 - iy0);
  const sx = ix0 < ix1 ? 1 : -1;
  const sy = iy0 < iy1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    drawBrush(bits, ix0, iy0, radius, ink, pattern);
    if (ix0 === ix1 && iy0 === iy1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      ix0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      iy0 += sy;
    }
  }
}

export function drawRect(
  bits: Uint8Array,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  filled = false,
  pattern: PaintPattern = 'solid',
): void {
  const left = Math.max(0, Math.min(Math.floor(x0), Math.floor(x1)));
  const right = Math.min(CARD_WIDTH - 1, Math.max(Math.floor(x0), Math.floor(x1)));
  const top = Math.max(0, Math.min(Math.floor(y0), Math.floor(y1)));
  const bottom = Math.min(CARD_HEIGHT - 1, Math.max(Math.floor(y0), Math.floor(y1)));

  for (let y = top; y <= bottom; y++) {
    for (let x = left; x <= right; x++) {
      const onEdge = x === left || x === right || y === top || y === bottom;
      if (onEdge) {
        setPixel(bits, x, y, 1);
      } else if (filled) {
        setPixel(bits, x, y, samplePattern(x, y, pattern));
      }
    }
  }
}

export function floodFill(
  bits: Uint8Array,
  startX: number,
  startY: number,
  pattern: PaintPattern = 'solid',
): void {
  const sx = Math.floor(startX);
  const sy = Math.floor(startY);
  if (sx < 0 || sx >= CARD_WIDTH || sy < 0 || sy >= CARD_HEIGHT) return;

  const targetVal = bits[sy * CARD_WIDTH + sx];
  const fillVal = targetVal === 0 ? 1 : 0;

  const visited = new Uint8Array(BITMAP_SIZE);
  const stack: number[] = [sx, sy];

  while (stack.length > 0) {
    const y = stack.pop()!;
    const x = stack.pop()!;
    const idx = y * CARD_WIDTH + x;
    if (visited[idx] || bits[idx] !== targetVal) continue;
    visited[idx] = 1;
    bits[idx] = fillVal === 1 ? samplePattern(x, y, pattern) : 0;

    if (x > 0) stack.push(x - 1, y);
    if (x < CARD_WIDTH - 1) stack.push(x + 1, y);
    if (y > 0) stack.push(x, y - 1);
    if (y < CARD_HEIGHT - 1) stack.push(x, y + 1);
  }
}
