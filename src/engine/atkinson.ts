export interface DitherOptions {
  brightness?: number; // -100 .. 100
  contrast?: number;   // -100 .. 100
  mode?: 'atkinson' | 'threshold';
}

/**
 * True Bill Atkinson 1-Bit Error-Diffusion Dithering (1984–1987 Apple Macintosh / HyperCard).
 * Unlike Floyd-Steinberg (which diffuses 100% of error), Atkinson diffuses 6/8 (75%) across
 * 6 neighbors, yielding crisp highlights and airy midtones ideal for 1-bit displays.
 *
 * Output convention: 1 = dark ink pixel, 0 = light paper pixel.
 */
export function atkinsonDitherGrayscale(
  grayInput: Float32Array,
  width: number,
  height: number,
  options: DitherOptions = {},
): Uint8Array {
  const brightness = options.brightness ?? 0;
  const contrast = options.contrast ?? 0;
  const mode = options.mode ?? 'atkinson';

  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  const buf = new Float32Array(width * height);

  for (let i = 0; i < buf.length; i++) {
    const adjusted = factor * (grayInput[i] + brightness - 128) + 128;
    buf[i] = Math.max(0, Math.min(255, adjusted));
  }

  const out = new Uint8Array(width * height);

  if (mode === 'threshold') {
    for (let i = 0; i < buf.length; i++) {
      out[i] = buf[i] < 128 ? 1 : 0;
    }
    return out;
  }

  const addError = (x: number, y: number, err: number) => {
    if (x >= 0 && x < width && y >= 0 && y < height) {
      buf[y * width + x] += err;
    }
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const oldVal = buf[idx];
      const isLight = oldVal >= 128;
      const newVal = isLight ? 255 : 0;
      out[idx] = isLight ? 0 : 1;

      const err = (oldVal - newVal) / 8;
      addError(x + 1, y, err);
      addError(x + 2, y, err);
      addError(x - 1, y + 1, err);
      addError(x, y + 1, err);
      addError(x + 1, y + 1, err);
      addError(x, y + 2, err);
    }
  }

  return out;
}

export function atkinsonDitherRgba(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  options: DitherOptions = {},
): Uint8Array {
  const gray = new Float32Array(width * height);
  for (let i = 0; i < gray.length; i++) {
    const p = i * 4;
    const alpha = rgba[p + 3] / 255;
    const lum = 0.299 * rgba[p] + 0.587 * rgba[p + 1] + 0.114 * rgba[p + 2];
    // Blend transparent pixels onto bright paper (255)
    gray[i] = lum * alpha + 255 * (1 - alpha);
  }
  return atkinsonDitherGrayscale(gray, width, height, options);
}
