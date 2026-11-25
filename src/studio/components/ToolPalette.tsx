import {
  Eraser,
  ImagePlus,
  Minus,
  MousePointer2,
  PaintBucket,
  Pencil,
  Redo2,
  Square,
  Target,
  Trash2,
  Type,
  Undo2,
} from 'lucide-react';
import type { PaintPattern } from '../../engine/bitmap';
import { type AuthorTool, useStudio } from '../store/useStudioStore';

const OBJECT_TOOLS: Array<{ id: AuthorTool; title: string; icon: React.ReactNode }> = [
  { id: 'select', title: 'Select / Drag', icon: <MousePointer2 size={14} /> },
  { id: 'button', title: 'Add Button', icon: <span style={{ fontSize: 10, fontWeight: 800 }}>BTN</span> },
  { id: 'field', title: 'Add Text Field', icon: <Type size={14} /> },
  { id: 'hotspot', title: 'Add Invisible Hotspot', icon: <Target size={14} /> },
];

const PAINT_TOOLS: Array<{ id: AuthorTool; title: string; icon: React.ReactNode }> = [
  { id: 'pencil', title: '1-Bit Pencil', icon: <Pencil size={14} /> },
  { id: 'line', title: '1-Bit Line', icon: <Minus size={14} /> },
  { id: 'rect', title: '1-Bit Rectangle', icon: <Square size={14} /> },
  { id: 'bucket', title: 'Flood Fill Bucket', icon: <PaintBucket size={14} /> },
  { id: 'eraser', title: '1-Bit Eraser', icon: <Eraser size={14} /> },
];

const PATTERNS: Array<{ id: PaintPattern; label: string }> = [
  { id: 'solid', label: 'Solid' },
  { id: 'stipple50', label: '50%' },
  { id: 'diagonal', label: 'Hatch' },
  { id: 'checker', label: 'Check' },
];

export function ToolPalette() {
  const {
    activeTool,
    activePattern,
    canUndo,
    canRedo,
    setActiveTool,
    setActivePattern,
    setDitherModalOpen,
    updateActiveCard,
    undo,
    redo,
  } = useStudio();

  return (
    <aside className="hc-tools" aria-label="Author tools">
      <div className="hc-section-label">Objects</div>
      <div className="hc-tool-grid">
        {OBJECT_TOOLS.map((t) => (
          <button
            key={t.id}
            type="button"
            title={t.title}
            aria-label={t.title}
            className={`hc-tool-btn ${activeTool === t.id ? 'active' : ''}`}
            onClick={() => setActiveTool(t.id)}
          >
            {t.icon}
          </button>
        ))}
      </div>

      <div className="hc-dropdown-divider" />

      <div className="hc-section-label">1-Bit Paint</div>
      <div className="hc-tool-grid">
        {PAINT_TOOLS.map((t) => (
          <button
            key={t.id}
            type="button"
            title={t.title}
            aria-label={t.title}
            className={`hc-tool-btn ${activeTool === t.id ? 'active' : ''}`}
            onClick={() => setActiveTool(t.id)}
          >
            {t.icon}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="hc-tool-wide"
        title="Import any photo using Bill Atkinson 1-bit dithering"
        onClick={() => setDitherModalOpen(true)}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <ImagePlus size={12} /> Dither Img
        </span>
      </button>

      <div className="hc-section-label" style={{ marginTop: 4 }}>
        Pattern
      </div>
      <div className="hc-tool-grid">
        {PATTERNS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`hc-tool-btn ${activePattern === p.id ? 'active' : ''}`}
            style={{ fontSize: 9.5, fontWeight: 700 }}
            onClick={() => setActivePattern(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="hc-dropdown-divider" />

      <div className="hc-tool-grid">
        <button type="button" className="hc-tool-btn" title="Undo (Cmd+Z)" disabled={!canUndo} onClick={undo}>
          <Undo2 size={13} />
        </button>
        <button type="button" className="hc-tool-btn" title="Redo (Cmd+Shift+Z)" disabled={!canRedo} onClick={redo}>
          <Redo2 size={13} />
        </button>
      </div>

      <button
        type="button"
        className="hc-tool-wide"
        title="Clear card 1-bit paint layer"
        onClick={() => updateActiveCard((c) => ({ ...c, bitmapRle: '' }), true)}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Trash2 size={11} /> Clear Art
        </span>
      </button>
    </aside>
  );
}
