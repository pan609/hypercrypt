import { atkinsonDitherGrayscale } from '../engine/atkinson';
import { encodeBitmapRle } from '../engine/bitmap';
import { CARD_HEIGHT, CARD_WIDTH } from '../engine/types';

function renderAtkinsonScene(pixelFn: (x: number, y: number) => number): string {
  const gray = new Float32Array(CARD_WIDTH * CARD_HEIGHT);
  for (let y = 0; y < CARD_HEIGHT; y++) {
    for (let x = 0; x < CARD_WIDTH; x++) {
      gray[y * CARD_WIDTH + x] = pixelFn(x, y);
    }
  }
  const bits = atkinsonDitherGrayscale(gray, CARD_WIDTH, CARD_HEIGHT, { mode: 'atkinson' });
  return encodeBitmapRle(bits);
}

/**
 * Card 1: Cozy 1987 Compact Macintosh with smiling pixel spirit + 3.5" floppy disk on sunlit desk
 */
export function buildAtticMacArt(): string {
  return renderAtkinsonScene((x, y) => {
    // Work in 2x scaled coordinates matching our approved 256x171 mockup geometry
    const ux = x / 2;
    const uy = y / 2;
    let val = 250;

    if (ux < 118) {
      const dx = (ux - 58) / 56;
      const dy = (uy - 76) / 62;
      const rad = Math.sqrt(dx * dx + dy * dy);
      val = rad < 0.92 ? 236 - (1 - rad) * 26 : 248;

      // Desk surface
      if (uy >= 122 && uy <= 125 && ux > 10 && ux < 110) val = 42;
      if (uy > 125 && uy < 146 && ux > 10 && ux < 110) {
        val = 214 + ((Math.floor(ux) + Math.floor(uy)) % 4 === 0 ? -18 : 10);
      }

      // Twinkling 4-point stars
      const stars = [
        [22, 34],
        [96, 28],
        [102, 54],
        [20, 62],
      ];
      for (const [sx, sy] of stars) {
        const adx = Math.abs(ux - sx);
        const ady = Math.abs(uy - sy);
        if ((adx <= 3.5 && ady <= 0.7) || (ady <= 3.5 && adx <= 0.7)) val = 30;
      }

      // 1987 Compact Macintosh body
      if (ux >= 30 && ux <= 88 && uy >= 48 && uy <= 122) {
        val = 220 - (ux - 30) * 0.7 - (uy - 48) * 0.35;
        if (ux <= 32 || ux >= 86 || uy <= 50 || uy >= 120) val = 26;

        // Screen bezel
        if (ux >= 38 && ux <= 80 && uy >= 57 && uy <= 92) {
          val = 246;
          if (ux <= 39.2 || ux >= 78.8 || uy <= 58.2 || uy >= 90.8) val = 22;

          // Friendly smiling pixel ghost inside screen
          const gx = (ux - 59) / 13;
          const gy = (uy - 75) / 12;
          const inDome = gx * gx + gy * gy < 1.0 && uy <= 76;
          const inBody = Math.abs(ux - 59) <= 13 && uy > 76 && uy <= 87;
          const wave = Math.sin((ux - 46) * 0.72) * 2.2;
          const inHem = Math.abs(ux - 59) <= 13 && uy > 87 && uy <= 88 + wave;

          if (inDome || inBody || inHem) {
            val = 252;
            const edgeDist = Math.abs(gx * gx + gy * gy - 1.0);
            if ((uy <= 76 && edgeDist < 0.22) || (uy > 76 && Math.abs(Math.abs(ux - 59) - 13) <= 1.2)) {
              val = 24;
            }
            const le = ((ux - 54) / 2.2) ** 2 + ((uy - 73) / 2.6) ** 2;
            const re = ((ux - 64) / 2.2) ** 2 + ((uy - 73) / 2.6) ** 2;
            if (le < 1 || re < 1) val = 14;
            // Happy upward-curving smile
            const smx = ux - 59;
            const smy = uy - 81;
            if (Math.abs(smx) <= 4.5 && Math.abs(smy + smx * smx * 0.16) < 0.95) val = 18;
          }
        }

        // 3.5" Floppy drive slot
        if (ux >= 56 && ux <= 80 && uy >= 101 && uy <= 103) val = 22;
        if (ux >= 64 && ux <= 72 && uy >= 99 && uy <= 105) val = 22;
        // Emblem badge
        if (ux >= 38 && ux <= 44 && uy >= 100 && uy <= 106) val = 95;
        if (Math.abs(uy - 112) < 0.8 && ux >= 33 && ux <= 85) val = 120;
      }

      // 3.5" Floppy disk beside Mac
      if (ux >= 91 && ux <= 107 && uy >= 104 && uy <= 121) {
        val = 152;
        if (ux <= 92.2 || ux >= 105.8 || uy <= 105.2 || uy >= 119.8) val = 24;
        if (ux >= 95 && ux <= 103 && uy >= 112 && uy <= 119) val = 248;
        if (ux >= 96 && ux <= 102 && uy >= 105 && uy <= 110) val = 70;
      }
    } else {
      const borderFrame = Math.abs(ux - 250) < 0.7 || Math.abs(uy - 5) < 0.7 || Math.abs(uy - 165) < 0.7;
      val = borderFrame ? 185 : 252;
    }

    return val;
  });
}

/**
 * Card 2: Vintage 3.5" HyperCard Boot Floppy Disk illustration
 */
export function buildFloppyArt(): string {
  return renderAtkinsonScene((x, y) => {
    const ux = x / 2;
    const uy = y / 2;
    let val = 250;

    if (ux >= 24 && ux <= 112 && uy >= 32 && uy <= 126) {
      // Chamfered top-right corner of 3.5" disk
      if (ux + (126 - uy) > 198 && ux > 98 && uy < 46) return 250;
      val = 165 - (ux - 24) * 0.45 - (uy - 32) * 0.25;
      if (ux <= 26 || ux >= 110 || uy <= 34 || uy >= 124) val = 22;

      // Metallic sliding shutter at top
      if (ux >= 44 && ux <= 92 && uy >= 34 && uy <= 64) {
        val = 195 + Math.sin((ux - 44) * 0.25) * 28;
        if (ux <= 45.5 || ux >= 90.5 || uy >= 62.5) val = 28;
        // Shutter cutout window
        if (ux >= 72 && ux <= 84 && uy >= 39 && uy <= 58) val = 48;
      }

      // Cream paper label at bottom
      if (ux >= 34 && ux <= 102 && uy >= 74 && uy <= 122) {
        val = 248;
        if (ux <= 35.5 || ux >= 100.5 || uy <= 75.5) val = 35;
        // Ruled stripes on label
        if ((Math.abs(uy - 88) < 0.7 || Math.abs(uy - 98) < 0.7 || Math.abs(uy - 108) < 0.7) && ux > 40 && ux < 96) {
          val = 140;
        }
        // Header stripe on label
        if (uy >= 76 && uy <= 82 && ux > 36 && ux < 100) val = 90;
      }
    } else if (ux < 126) {
      const d = Math.hypot((ux - 68) / 62, (uy - 80) / 62);
      val = d < 0.95 ? 238 : 250;
    }
    return val;
  });
}

/**
 * Card 3: Vintage 1987 Mechanical Calendar / Time Dial
 */
export function buildTimeDialArt(): string {
  return renderAtkinsonScene((x, y) => {
    const ux = x / 2;
    const uy = y / 2;
    let val = 250;
    const cx = 66;
    const cy = 82;
    const r = Math.hypot(ux - cx, uy - cy);
    if (r <= 44) {
      val = 236 - (r / 44) * 45;
      if (r >= 40) val = 24;
      if (r <= 36) val = 246 - (ux - cx) * 0.35;
      // Clock ticks
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6;
        const tx = cx + Math.cos(a) * 31;
        const ty = cy + Math.sin(a) * 31;
        if (Math.hypot(ux - tx, uy - ty) < 2.2) val = 20;
      }
      // Clock hands pointing to 10:10
      const d1 = Math.abs((ux - cx) * 0.5 + (uy - cy) * 0.86);
      if (ux <= cx && uy <= cy && r < 24 && d1 < 1.6) val = 18;
      const d2 = Math.abs((ux - cx) * -0.5 + (uy - cy) * 0.86);
      if (ux >= cx && uy <= cy && r < 30 && d2 < 1.4) val = 18;
      if (r < 4) val = 18;
    }
    return val;
  });
}

/**
 * Card 6: Celebratory 1987 -> 2026 Resurrection Emblem with Cheering Pixel Spirit
 */
export function buildResurrectionArt(): string {
  return renderAtkinsonScene((x, y) => {
    const ux = x / 2;
    const uy = y / 2;
    let val = 250;

    // Sunburst rays behind emblem on left half
    const cx = 64;
    const cy = 78;
    const dx = ux - cx;
    const dy = uy - cy;
    const r = Math.hypot(dx, dy);
    if (ux < 122 && r < 58) {
      const angle = Math.atan2(dy, dx);
      const ray = Math.sin(angle * 10);
      val = ray > 0.2 ? 220 : 244;
    }

    // Floating cheerful pixel ghost with celebration halo
    const gx = (ux - cx) / 22;
    const gy = (uy - (cy - 2)) / 20;
    const inDome = gx * gx + gy * gy < 1.0 && uy <= cy;
    const inBody = Math.abs(ux - cx) <= 22 && uy > cy && uy <= cy + 20;
    const wave = Math.sin((ux - (cx - 22)) * 0.45) * 4;
    const inHem = Math.abs(ux - cx) <= 22 && uy > cy + 20 && uy <= cy + 22 + wave;

    if (inDome || inBody || inHem) {
      val = 252 - Math.max(0, (ux - cx) * 0.9);
      const edge = Math.abs(gx * gx + gy * gy - 1.0);
      if ((uy <= cy && edge < 0.16) || (uy > cy && Math.abs(Math.abs(ux - cx) - 22) < 1.8)) val = 20;

      // Joyful eyes
      if (Math.hypot(ux - (cx - 8), uy - (cy - 4)) < 3.4) val = 14;
      if (Math.hypot(ux - (cx + 8), uy - (cy - 4)) < 3.4) val = 14;
      // Big cheerful grin
      const smx = ux - cx;
      const smy = uy - (cy + 8);
      if (Math.abs(smx) <= 7.5 && Math.abs(smy + smx * smx * 0.1) < 1.2) val = 16;
    }

    return val;
  });
}

/**
 * Sample grayscale landscape for Atkinson Darkroom showcase (vintage lighthouse by sunlit sea)
 */
export function buildLighthouseArt(): string {
  return renderAtkinsonScene((x, y) => {
    const ux = x / 2;
    const uy = y / 2;
    if (ux > 136) return 252;

    // Soft sky gradient
    let val = 236 - (1 - uy / 171) * 58;

    // Sun with glowing concentric warmth
    const sunDist = Math.hypot(ux - 34, uy - 38);
    if (sunDist < 15) val = 252;
    else if (sunDist < 32) val = Math.min(250, val + (32 - sunDist) * 2.2);

    // Sea horizon at uy = 112
    if (uy >= 112) {
      const wave = Math.sin(ux * 0.25 + uy * 0.6) * 18;
      val = 142 + (uy - 112) * 1.1 + wave;
    }

    // Rocky headland on right-center
    if (uy > 96 + Math.sin(ux * 0.08) * 8 && ux > 58 && ux < 130) {
      val = 76 + (ux - 58) * 0.6;
    }

    // Classic striped lighthouse tower
    const towerHalfW = 7 + ((uy - 34) / 70) * 6;
    if (uy >= 34 && uy <= 104 && Math.abs(ux - 92) <= towerHalfW) {
      const stripe = Math.floor((uy - 34) / 14) % 2 === 0;
      val = stripe ? 235 - (ux - 92) * 3 : 65 - (ux - 92) * 1.5;
      if (Math.abs(Math.abs(ux - 92) - towerHalfW) < 1.2) val = 22;
    }

    // Lantern room top
    if (uy >= 22 && uy < 34 && Math.abs(ux - 92) <= 7.5) {
      val = uy < 26 ? 35 : 248;
      if (Math.abs(Math.abs(ux - 92) - 7.5) < 1.1) val = 22;
    }

    return Math.max(0, Math.min(255, val));
  });
}
