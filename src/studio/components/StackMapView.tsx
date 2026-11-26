import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Edit3, Play } from 'lucide-react';
import { decodeBitmapRle } from '../../engine/bitmap';
import { analyzeStackGraph, type StackGraphNode } from '../../engine/stackGraph';
import { CARD_HEIGHT, CARD_WIDTH, type ThemeId } from '../../engine/types';
import { useStudio } from '../store/useStudioStore';

const NODE_W = 196;
const NODE_H = 128;

function MiniBitmapThumb({ bitmapRle, theme }: { bitmapRle: string; theme: ThemeId }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = 128;
    const h = 85;
    const bits = decodeBitmapRle(bitmapRle);
    const img = ctx.createImageData(w, h);
    const fg = theme === 'kiroween' ? [237, 230, 255] : [36, 32, 27];
    const bg = theme === 'kiroween' ? [27, 20, 49] : [251, 248, 241];

    for (let y = 0; y < h; y++) {
      const sy = Math.floor((y / h) * CARD_HEIGHT);
      for (let x = 0; x < w; x++) {
        const sx = Math.floor((x / w) * CARD_WIDTH);
        const on = bits[sy * CARD_WIDTH + sx] === 1;
        const p = (y * w + x) * 4;
        const col = on ? fg : bg;
        img.data[p] = col[0];
        img.data[p + 1] = col[1];
        img.data[p + 2] = col[2];
        img.data[p + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }, [bitmapRle, theme]);

  return (
    <canvas
      ref={ref}
      width={128}
      height={85}
      style={{
        width: '100%',
        height: 68,
        objectFit: 'cover',
        imageRendering: 'pixelated',
        display: 'block',
        borderBottom: '1px solid var(--hc-border)',
      }}
    />
  );
}

export function StackMapView() {
  const { stack, activeCardIndex, theme, t, goToCard, setMode } = useStudio();
  const graph = useMemo(() => analyzeStackGraph(stack), [stack]);
  const [selectedIdx, setSelectedIdx] = useState(activeCardIndex);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});

  // Compute deterministic default DAG-like grid positions per stack
  const defaultPositions = useMemo(() => {
    const out: Record<string, { x: number; y: number }> = {};
    const cols = Math.min(3, Math.max(2, Math.ceil(Math.sqrt(graph.nodes.length))));
    graph.nodes.forEach((node, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      out[node.cardId] = {
        x: 42 + col * 270,
        y: 38 + row * 195,
      };
    });
    return out;
  }, [graph.nodes]);

  const getPos = (node: StackGraphNode) => positions[node.cardId] ?? defaultPositions[node.cardId] ?? { x: 40, y: 40 };

  const startDrag = (e: React.PointerEvent, node: StackGraphNode) => {
    e.stopPropagation();
    setSelectedIdx(node.cardIndex);
    const startX = e.clientX;
    const startY = e.clientY;
    const orig = getPos(node);

    const onMove = (ev: PointerEvent) => {
      setPositions((prev) => ({
        ...prev,
        [node.cardId]: {
          x: Math.max(12, Math.round(orig.x + (ev.clientX - startX))),
          y: Math.max(12, Math.round(orig.y + (ev.clientY - startY))),
        },
      }));
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const selectedNode = graph.nodes[selectedIdx] ?? graph.nodes[0];
  const outgoing = graph.edges.filter((e) => e.fromIndex === selectedNode?.cardIndex);
  const incoming = graph.edges.filter((e) => e.toIndex === selectedNode?.cardIndex);

  const canvasW = Math.max(
    880,
    ...graph.nodes.map((n) => getPos(n).x + NODE_W + 60),
  );
  const canvasH = Math.max(
    460,
    ...graph.nodes.map((n) => getPos(n).y + NODE_H + 60),
  );

  return (
    <main className="hc-map-layout" data-testid="stack-map-view">
      {/* Top Static Analysis Audit Bar */}
      <div className="hc-map-auditbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span className="hc-hud-pill">
            {t.mapCards}: <strong>{graph.nodes.length}</strong>
          </span>
          <span className="hc-hud-pill">
            {t.mapLinks}: <strong>{graph.edges.length}</strong>
          </span>
          <span className="hc-hud-pill">
            {t.mapBranches}: <strong>{graph.conditionalBranches}</strong>
          </span>
          <span className="hc-hud-pill">
            {t.mapScripts}: <strong>{graph.totalScripts}</strong>
          </span>
          <span
            className="hc-hud-pill"
            style={{
              color: graph.brokenLinks === 0 && graph.totalErrors === 0 ? 'var(--hc-success)' : 'var(--hc-danger)',
            }}
          >
            {graph.brokenLinks === 0 && graph.totalErrors === 0 ? (
              <CheckCircle2 size={13} />
            ) : (
              <AlertTriangle size={13} />
            )}
            {t.mapBroken}: <strong>{graph.brokenLinks}</strong>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 10.5, color: 'var(--hc-ink-muted)' }}>
          <span>─── {t.mapLegendDirect}</span>
          <span>- - - {t.mapLegendCond}</span>
          <span style={{ color: 'var(--hc-danger)' }}>✕ {t.mapLegendBroken}</span>
        </div>
      </div>

      {/* Main Graph Viewport + Right Detail Strip */}
      <div className="hc-map-body">
        <div className="hc-map-canvas-scroll">
          <div style={{ position: 'relative', width: canvasW, height: canvasH }}>
            <svg
              width={canvasW}
              height={canvasH}
              style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }}
            >
              <defs>
                <marker id="hc-arrow-solid" markerWidth="9" markerHeight="9" refX="8" refY="3.5" orient="auto">
                  <polygon points="0 0, 9 3.5, 0 7" fill="var(--hc-border)" />
                </marker>
                <marker id="hc-arrow-cond" markerWidth="9" markerHeight="9" refX="8" refY="3.5" orient="auto">
                  <polygon points="0 0, 9 3.5, 0 7" fill="var(--hc-accent)" />
                </marker>
              </defs>

              {graph.edges.map((edge, idx) => {
                if (edge.toIndex === null || edge.fromIndex === edge.toIndex) return null;
                const fromNode = graph.nodes[edge.fromIndex];
                const toNode = graph.nodes[edge.toIndex];
                if (!fromNode || !toNode) return null;
                const p1 = getPos(fromNode);
                const p2 = getPos(toNode);

                const x1 = p1.x + NODE_W / 2;
                const y1 = p1.y + NODE_H / 2;
                const x2 = p2.x + NODE_W / 2;
                const y2 = p2.y + NODE_H / 2;

                // Curve offset so bidirectional edges stay cleanly separated
                const dx = x2 - x1;
                const dy = y2 - y1;
                const dist = Math.hypot(dx, dy) || 1;
                const nx = -dy / dist;
                const ny = dx / dist;
                const bend = (idx % 2 === 0 ? 1 : -1) * 26;
                const cx = (x1 + x2) / 2 + nx * bend;
                const cy = (y1 + y2) / 2 + ny * bend;

                // Trim arrow end slightly outside destination box center
                const endRatio = Math.max(0.25, (dist - 62) / dist);
                const tx = x1 + dx * endRatio;
                const ty = y1 + dy * endRatio;

                return (
                  <g key={edge.id}>
                    <path
                      d={`M ${x1} ${y1} Q ${cx} ${cy} ${tx} ${ty}`}
                      fill="none"
                      stroke={edge.conditional ? 'var(--hc-accent)' : 'var(--hc-border)'}
                      strokeWidth={edge.fromIndex === selectedNode?.cardIndex ? 2.5 : 1.7}
                      strokeDasharray={edge.conditional ? '6 4' : undefined}
                      markerEnd={edge.conditional ? 'url(#hc-arrow-cond)' : 'url(#hc-arrow-solid)'}
                      opacity={edge.fromIndex === selectedNode?.cardIndex ? 1 : 0.65}
                    />
                  </g>
                );
              })}
            </svg>

            {graph.nodes.map((node) => {
              const pos = getPos(node);
              const isSelected = selectedNode?.cardIndex === node.cardIndex;
              const isActive = activeCardIndex === node.cardIndex;
              return (
                <div
                  key={node.cardId}
                  data-testid={`map-node-${node.cardIndex}`}
                  className={`hc-map-node ${isSelected ? 'selected' : ''} ${isActive ? 'current' : ''}`}
                  style={{ left: pos.x, top: pos.y, width: NODE_W, height: NODE_H }}
                  onPointerDown={(e) => startDrag(e, node)}
                  onDoubleClick={() => {
                    goToCard(node.cardIndex);
                    setMode('browse');
                  }}
                >
                  <div className="hc-map-node-head">
                    <span>
                      {node.cardIndex + 1}. {node.cardName}
                    </span>
                    {node.brokenLinkCount > 0 && (
                      <span style={{ color: 'var(--hc-danger)' }}>⚠ {node.brokenLinkCount}</span>
                    )}
                  </div>
                  <MiniBitmapThumb bitmapRle={node.bitmapRle} theme={theme} />
                  <div className="hc-map-node-foot">
                    <span>{node.objectCount} obj</span>
                    <span>{node.scriptedObjectCount} scripts</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ padding: '6px 14px', fontSize: 10.5, color: 'var(--hc-ink-muted)' }}>{t.mapDragHint}</div>
        </div>

        {/* Selected Card Node Inspector */}
        {selectedNode && (
          <aside className="hc-map-sidebar">
            <div className="hc-panel-box">
              <div className="hc-section-label">
                Card {selectedNode.cardIndex + 1} / {graph.nodes.length}
              </div>
              <strong style={{ fontSize: 14 }}>{selectedNode.cardName}</strong>
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <button
                  type="button"
                  className="hc-btn primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => {
                    goToCard(selectedNode.cardIndex);
                    setMode('browse');
                  }}
                >
                  <Play size={12} /> {t.mapPlayCard}
                </button>
                <button
                  type="button"
                  className="hc-btn"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => {
                    goToCard(selectedNode.cardIndex);
                    setMode('author');
                  }}
                >
                  <Edit3 size={12} /> {t.mapEditCard}
                </button>
              </div>
            </div>

            <div className="hc-panel-box">
              <div className="hc-section-label">Outgoing Links ({outgoing.length})</div>
              {outgoing.length === 0 ? (
                <div style={{ fontSize: 11, color: 'var(--hc-ink-muted)' }}>No outgoing go-to-card jumps.</div>
              ) : (
                outgoing.map((e) => (
                  <div key={e.id} className="hc-prop-row" style={{ fontSize: 10.5 }}>
                    <span>
                      <strong>{e.sourceObjectName}</strong> →{' '}
                      <span style={{ color: e.broken ? 'var(--hc-danger)' : 'inherit' }}>{e.targetLabel}</span>
                    </span>
                    <span style={{ color: 'var(--hc-ink-muted)' }}>{e.conditional ? 'if' : 'go'}</span>
                  </div>
                ))
              )}
            </div>

            <div className="hc-panel-box">
              <div className="hc-section-label">Incoming Links ({incoming.length})</div>
              {incoming.length === 0 ? (
                <div style={{ fontSize: 11, color: 'var(--hc-ink-muted)' }}>Entry card / no incoming jumps.</div>
              ) : (
                incoming.map((e) => (
                  <div key={e.id} className="hc-prop-row" style={{ fontSize: 10.5 }}>
                    <span>
                      Card {e.fromIndex + 1} ({e.sourceObjectName})
                    </span>
                    <span style={{ color: 'var(--hc-ink-muted)' }}>L{e.line}</span>
                  </div>
                ))
              )}
            </div>
          </aside>
        )}
      </div>
    </main>
  );
}
