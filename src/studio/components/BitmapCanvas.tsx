import { useEffect, useRef } from 'react';
import {
  decodeBitmapRle,
  drawBrush,
  drawLine,
  drawRect,
  encodeBitmapRle,
  floodFill,
} from '../../engine/bitmap';
import { CARD_HEIGHT, CARD_WIDTH } from '../../engine/types';
import { useStudio } from '../store/useStudioStore';

const PAINT_TOOLS = new Set(['pencil', 'line', 'rect', 'bucket', 'eraser']);

function paintBitsToCanvas(canvas: HTMLCanvasElement, bits: Uint8Array, theme: 'classic' | 'kiroween') {
  const ctx = canvas.getContext('2d');
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
}

export function BitmapCanvas() {
  const { activeCard, mode, theme, activeTool, activePattern, updateActiveCard } = useStudio();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const workingBitsRef = useRef<Uint8Array | null>(null);
  const snapshotBitsRef = useRef<Uint8Array | null>(null);
  const startPtRef = useRef<{ x: number; y: number } | null>(null);
  const lastPtRef = useRef<{ x: number; y: number } | null>(null);

  const isPaintMode = mode === 'author' && PAINT_TOOLS.has(activeTool);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const bits = decodeBitmapRle(activeCard.bitmapRle);
    workingBitsRef.current = bits;
    paintBitsToCanvas(canvas, bits, theme);
  }, [activeCard.bitmapRle, theme]);

  const toCardCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(CARD_WIDTH - 1, Math.floor(((e.clientX - rect.left) / rect.width) * CARD_WIDTH)));
    const y = Math.max(0, Math.min(CARD_HEIGHT - 1, Math.floor(((e.clientY - rect.top) / rect.height) * CARD_HEIGHT)));
    return { x, y };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPaintMode || !canvasRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const pt = toCardCoords(e);
    const bits = new Uint8Array(workingBitsRef.current ?? decodeBitmapRle(activeCard.bitmapRle));
    workingBitsRef.current = bits;
    snapshotBitsRef.current = new Uint8Array(bits);
    startPtRef.current = pt;
    lastPtRef.current = pt;

    if (activeTool === 'bucket') {
      floodFill(bits, pt.x, pt.y, activePattern);
      paintBitsToCanvas(canvasRef.current, bits, theme);
      updateActiveCard((c) => ({ ...c, bitmapRle: encodeBitmapRle(bits) }), true);
      startPtRef.current = null;
      return;
    }

    if (activeTool === 'pencil' || activeTool === 'eraser') {
      const ink = activeTool === 'eraser' ? 0 : 1;
      const radius = activeTool === 'eraser' ? 5 : 1;
      drawBrush(bits, pt.x, pt.y, radius, ink, activePattern);
      paintBitsToCanvas(canvasRef.current, bits, theme);
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPaintMode || !startPtRef.current || !canvasRef.current || !workingBitsRef.current) return;
    const pt = toCardCoords(e);

    if (activeTool === 'pencil' || activeTool === 'eraser') {
      const prev = lastPtRef.current ?? pt;
      const ink = activeTool === 'eraser' ? 0 : 1;
      const radius = activeTool === 'eraser' ? 5 : 1;
      drawLine(workingBitsRef.current, prev.x, prev.y, pt.x, pt.y, radius, ink, activePattern);
      lastPtRef.current = pt;
      paintBitsToCanvas(canvasRef.current, workingBitsRef.current, theme);
    } else if (activeTool === 'line' || activeTool === 'rect') {
      const preview = new Uint8Array(snapshotBitsRef.current!);
      if (activeTool === 'line') {
        drawLine(preview, startPtRef.current.x, startPtRef.current.y, pt.x, pt.y, 1, 1, activePattern);
      } else {
        drawRect(preview, startPtRef.current.x, startPtRef.current.y, pt.x, pt.y, false, activePattern);
      }
      workingBitsRef.current = preview;
      paintBitsToCanvas(canvasRef.current, preview, theme);
    }
  };

  const onPointerUp = () => {
    if (!isPaintMode || !startPtRef.current || !workingBitsRef.current) return;
    const finalRle = encodeBitmapRle(workingBitsRef.current);
    startPtRef.current = null;
    lastPtRef.current = null;
    snapshotBitsRef.current = null;
    updateActiveCard((c) => ({ ...c, bitmapRle: finalRle }), true);
  };

  return (
    <canvas
      ref={canvasRef}
      width={CARD_WIDTH}
      height={CARD_HEIGHT}
      className="hc-bitmap-canvas"
      style={{
        cursor: isPaintMode ? 'crosshair' : 'default',
        pointerEvents: isPaintMode ? 'auto' : 'none',
        zIndex: isPaintMode ? 10 : 1,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    />
  );
}
