import { useEffect, useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { atkinsonDitherGrayscale, atkinsonDitherRgba } from '../../engine/atkinson';
import { encodeBitmapRle } from '../../engine/bitmap';
import { CARD_HEIGHT, CARD_WIDTH } from '../../engine/types';
import { useStudio } from '../store/useStudioStore';

function buildSampleGradientScene(variant: 'sphere' | 'mountains'): Float32Array {
  const gray = new Float32Array(CARD_WIDTH * CARD_HEIGHT);
  for (let y = 0; y < CARD_HEIGHT; y++) {
    for (let x = 0; x < CARD_WIDTH; x++) {
      if (variant === 'sphere') {
        const dx = (x - CARD_WIDTH / 2) / 115;
        const dy = (y - CARD_HEIGHT / 2) / 115;
        const d2 = dx * dx + dy * dy;
        if (d2 <= 1) {
          const nz = Math.sqrt(1 - d2);
          const light = Math.max(0, dx * -0.45 + dy * -0.45 + nz * 0.85);
          gray[y * CARD_WIDTH + x] = 20 + light * 232;
        } else {
          gray[y * CARD_WIDTH + x] = 242 - (y / CARD_HEIGHT) * 35;
        }
      } else {
        // Moonlit retro mountains
        let val = 215 - (1 - y / CARD_HEIGHT) * 105;
        const moon = Math.hypot(x - 120, y - 82);
        if (moon < 34) val = 250;
        else if (moon < 68) val = Math.min(248, val + (68 - moon) * 1.6);
        const ridge1 = 210 - Math.sin(x * 0.018) * 48 - Math.cos(x * 0.042) * 18;
        const ridge2 = 255 - Math.sin(x * 0.025 + 1.4) * 34;
        if (y > ridge1) val = 112 + (y - ridge1) * 0.45;
        if (y > ridge2) val = 48 + (y - ridge2) * 0.3;
        gray[y * CARD_WIDTH + x] = Math.max(0, Math.min(255, val));
      }
    }
  }
  return gray;
}

export function DitherModal() {
  const { ditherModalOpen, setDitherModalOpen, theme, updateActiveCard, showToast } = useStudio();
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(12);
  const [ditherMode, setDitherMode] = useState<'atkinson' | 'threshold'>('atkinson');
  const [sourceRgba, setSourceRgba] = useState<Uint8ClampedArray | null>(null);
  const [sampleVariant, setSampleVariant] = useState<'sphere' | 'mountains'>('mountains');

  const previewRef = useRef<HTMLCanvasElement | null>(null);
  const lastBitsRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    if (!ditherModalOpen || !previewRef.current) return;
    const bits = sourceRgba
      ? atkinsonDitherRgba(sourceRgba, CARD_WIDTH, CARD_HEIGHT, { brightness, contrast, mode: ditherMode })
      : atkinsonDitherGrayscale(buildSampleGradientScene(sampleVariant), CARD_WIDTH, CARD_HEIGHT, {
          brightness,
          contrast,
          mode: ditherMode,
        });

    lastBitsRef.current = bits;
    const ctx = previewRef.current.getContext('2d');
    if (!ctx) return;
    const img = ctx.createImageData(CARD_WIDTH, CARD_HEIGHT);
    const fg = theme === 'kiroween' ? [237, 230, 255] : [36, 32, 27];
    const bg = theme === 'kiroween' ? [27, 20, 49] : [251, 248, 241];
    for (let i = 0; i < bits.length; i++) {
      const p = i * 4;
      const col = bits[i] ? fg : bg;
      img.data[p] = col[0];
      img.data[p + 1] = col[1];
      img.data[p + 2] = col[2];
      img.data[p + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, [brightness, contrast, ditherMode, ditherModalOpen, sampleVariant, sourceRgba, theme]);

  if (!ditherModalOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const off = document.createElement('canvas');
      off.width = CARD_WIDTH;
      off.height = CARD_HEIGHT;
      const ctx = off.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
        // Cover-fit image cleanly onto 512x342
        const scale = Math.max(CARD_WIDTH / img.width, CARD_HEIGHT / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        ctx.drawImage(img, (CARD_WIDTH - dw) / 2, (CARD_HEIGHT - dh) / 2, dw, dh);
        const data = ctx.getImageData(0, 0, CARD_WIDTH, CARD_HEIGHT).data;
        setSourceRgba(data);
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const applyToCard = () => {
    if (!lastBitsRef.current) return;
    const rle = encodeBitmapRle(lastBitsRef.current);
    updateActiveCard((c) => ({ ...c, bitmapRle: rle }), true);
    setDitherModalOpen(false);
    showToast('Stamped 1-bit Atkinson dither artwork onto card!');
  };

  return (
    <div className="hc-modal-backdrop fixed" role="dialog" aria-modal="true" aria-label="Atkinson 1-Bit Dither Importer">
      <div className="hc-modal wide">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <strong>Bill Atkinson 1-Bit Dither Importer (512×342)</strong>
          <button type="button" className="hc-btn" onClick={() => setDitherModalOpen(false)}>
            <X size={13} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 14, alignItems: 'start' }}>
          <div style={{ border: '2px solid var(--hc-border)', borderRadius: 4, overflow: 'hidden' }}>
            <canvas
              ref={previewRef}
              width={CARD_WIDTH}
              height={CARD_HEIGHT}
              style={{ width: '100%', height: 'auto', display: 'block', imageRendering: 'pixelated' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 11.5 }}>
            <label className="hc-btn primary" style={{ justifyContent: 'center', cursor: 'pointer' }}>
              <Upload size={13} /> Upload Photo (PNG/JPG)
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
            </label>

            <div className="hc-panel-box">
              <div className="hc-section-label">Or Try Built-In Sample</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  className={`hc-btn ${!sourceRgba && sampleVariant === 'mountains' ? 'primary' : ''}`}
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => {
                    setSourceRgba(null);
                    setSampleVariant('mountains');
                  }}
                >
                  Mountains
                </button>
                <button
                  type="button"
                  className={`hc-btn ${!sourceRgba && sampleVariant === 'sphere' ? 'primary' : ''}`}
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => {
                    setSourceRgba(null);
                    setSampleVariant('sphere');
                  }}
                >
                  3D Sphere
                </button>
              </div>
            </div>

            <div className="hc-panel-box">
              <div className="hc-section-label">Algorithm</div>
              <div className="hc-seg" style={{ width: '100%' }}>
                <button
                  type="button"
                  style={{ flex: 1 }}
                  className={ditherMode === 'atkinson' ? 'active' : ''}
                  onClick={() => setDitherMode('atkinson')}
                >
                  Atkinson 1987
                </button>
                <button
                  type="button"
                  style={{ flex: 1 }}
                  className={ditherMode === 'threshold' ? 'active' : ''}
                  onClick={() => setDitherMode('threshold')}
                >
                  Threshold
                </button>
              </div>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span>Brightness: {brightness}</span>
                <input
                  type="range"
                  min={-80}
                  max={80}
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span>Contrast: {contrast}</span>
                <input
                  type="range"
                  min={-80}
                  max={80}
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                />
              </label>
            </div>

            <button type="button" className="hc-btn primary" style={{ justifyContent: 'center' }} onClick={applyToCard}>
              Stamp onto Active Card
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
