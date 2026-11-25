import { useEffect, useRef, useState } from 'react';
import { Code2 } from 'lucide-react';
import { CARD_HEIGHT, CARD_WIDTH, type CardObject } from '../../engine/types';
import { useStudio } from '../store/useStudioStore';
import { BitmapCanvas } from './BitmapCanvas';

const PAINT_TOOLS = new Set(['pencil', 'line', 'rect', 'bucket', 'eraser']);

export function CardStage() {
  const {
    stack,
    activeCard,
    activeCardIndex,
    mode,
    t,
    activeTool,
    selectedObjectId,
    activeModal,
    activeTransition,
    transitionNonce,
    setMode,
    setSelectedObjectId,
    setInspectorTab,
    goToCard,
    addObject,
    updateObject,
    runObjectHandler,
  } = useStudio();

  const scalerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [askDraft, setAskDraft] = useState('');

  // Track responsive container width to scale 512x342 cleanly
  useEffect(() => {
    const el = scalerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setScale(w / CARD_WIDTH);
    };
    update();
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(update);
      ro.observe(el);
      return () => ro.disconnect();
    }
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [mode]);

  useEffect(() => {
    if (activeModal?.kind === 'ask') {
      setAskDraft(activeModal.defaultValue);
    }
  }, [activeModal]);

  const isPaintMode = mode === 'author' && PAINT_TOOLS.has(activeTool);

  const handleStageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mode !== 'author' || isPaintMode) return;
    if (e.target !== e.currentTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    if (activeTool === 'button' || activeTool === 'field' || activeTool === 'hotspot') {
      addObject(activeTool, x - 60, y - 18);
    } else {
      setSelectedObjectId(null);
    }
  };

  const startDragObject = (e: React.PointerEvent, obj: CardObject) => {
    if (mode !== 'author' || isPaintMode) return;
    e.stopPropagation();
    setSelectedObjectId(obj.id);

    const startX = e.clientX;
    const startY = e.clientY;
    const origX = obj.x;
    const origY = obj.y;
    let moved = false;

    const onMove = (ev: PointerEvent) => {
      const dx = (ev.clientX - startX) / scale;
      const dy = (ev.clientY - startY) / scale;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) moved = true;
      if (!moved) return;
      const nx = Math.max(0, Math.min(CARD_WIDTH - obj.width, Math.round(origX + dx)));
      const ny = Math.max(0, Math.min(CARD_HEIGHT - obj.height, Math.round(origY + dy)));
      updateObject(obj.id, (cur) => ({ ...cur, x: nx, y: ny }), false);
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const startResizeObject = (e: React.PointerEvent, obj: CardObject) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const origW = obj.width;
    const origH = obj.height;

    const onMove = (ev: PointerEvent) => {
      const dw = (ev.clientX - startX) / scale;
      const dh = (ev.clientY - startY) / scale;
      const nw = Math.max(36, Math.min(CARD_WIDTH - obj.x, Math.round(origW + dw)));
      const nh = Math.max(22, Math.min(CARD_HEIGHT - obj.y, Math.round(origH + dh)));
      updateObject(obj.id, (cur) => ({ ...cur, width: nw, height: nh }), false);
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const fxClass =
    activeTransition && activeTransition !== 'none'
      ? `fx-${activeTransition.replace(/\s+/g, '-')}`
      : '';

  return (
    <main className="hc-stage-column">
      <div className="hc-window" data-testid="card-window">
        <div className="hc-titlebar">
          <div className="hc-close-box" aria-hidden="true" />
          <div className="hc-stripes" aria-hidden="true" />
          <span data-testid="window-title">
            {stack.title} — {activeCard.name} ({activeCardIndex + 1}/{stack.cards.length})
          </span>
          <div className="hc-stripes" aria-hidden="true" />
        </div>

        <div className="hc-card-scaler" ref={scalerRef}>
          <div
            key={`${activeCard.id}-${transitionNonce}`}
            className={`hc-card-logical ${fxClass}`}
            style={{ transform: `scale(${scale})` }}
          >
            <BitmapCanvas />

            <div
              className="hc-objects-layer"
              style={{ pointerEvents: isPaintMode ? 'none' : 'auto', zIndex: 5 }}
              onClick={handleStageClick}
            >
              {activeCard.objects.map((obj) => {
                if (!obj.visible && mode === 'browse') return null;
                const isSelected = mode === 'author' && selectedObjectId === obj.id;
                const hiddenInAuthor = !obj.visible && mode === 'author';

                return (
                  <div
                    key={obj.id}
                    className={`hc-obj ${isSelected ? 'author-selected' : ''}`}
                    style={{
                      left: obj.x,
                      top: obj.y,
                      width: obj.width,
                      height: obj.height,
                      opacity: hiddenInAuthor ? 0.45 : 1,
                    }}
                    onPointerDown={(e) => startDragObject(e, obj)}
                  >
                    {obj.type === 'button' ? (
                      <>
                        {mode === 'author' && obj.style === 'transparent' && (
                          <span className="hc-hotspot-badge">hotspot "{obj.name}"</span>
                        )}
                        <button
                          type="button"
                          aria-label={obj.name}
                          data-object-name={obj.name}
                          className={`hc-card-btn style-${obj.style} ${obj.accent ? 'accent' : ''} ${
                            mode === 'author' && obj.style === 'transparent' ? 'author-visible' : ''
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (mode === 'browse') {
                              void runObjectHandler(obj.id, 'mouseUp');
                            } else {
                              setSelectedObjectId(obj.id);
                            }
                          }}
                        >
                          {obj.style === 'checkbox'
                            ? `${obj.checked ? '[X]' : '[ ]'} ${obj.label}`
                            : obj.style === 'transparent'
                              ? ''
                              : obj.label}
                        </button>
                      </>
                    ) : obj.locked || mode === 'author' ? (
                      <div
                        data-field-name={obj.name}
                        className={`hc-card-field style-${obj.style}`}
                        style={{ fontSize: obj.fontSize ?? 12 }}
                        onClick={(e) => {
                          if (mode === 'author') {
                            e.stopPropagation();
                            setSelectedObjectId(obj.id);
                          }
                        }}
                      >
                        {obj.text}
                      </div>
                    ) : (
                      <textarea
                        aria-label={obj.name}
                        data-field-name={obj.name}
                        className={`hc-card-field editable style-${obj.style}`}
                        style={{ fontSize: obj.fontSize ?? 12 }}
                        value={obj.text}
                        onChange={(e) =>
                          updateObject(obj.id, (cur) => (cur.type === 'field' ? { ...cur, text: e.target.value } : cur))
                        }
                      />
                    )}

                    {isSelected && (
                      <div
                        className="hc-resize-handle"
                        title="Drag to resize"
                        onPointerDown={(e) => startResizeObject(e, obj)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Authentic Classic Mac Modal Dialog for `answer` / `ask` */}
          {activeModal && (
            <div className="hc-modal-backdrop" role="dialog" aria-modal="true" data-testid="ht-modal">
              <div className="hc-modal">
                <p style={{ margin: '0 0 12px', fontSize: 12.5, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  {activeModal.prompt}
                </p>

                {activeModal.kind === 'ask' && (
                  <input
                    autoFocus
                    className="hc-input"
                    style={{ width: '100%', marginBottom: 12, fontSize: 12.5, padding: '6px 9px' }}
                    value={askDraft}
                    onChange={(e) => setAskDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') activeModal.resolve(askDraft);
                      if (e.key === 'Escape') activeModal.resolve(null);
                    }}
                  />
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  {activeModal.kind === 'answer' ? (
                    activeModal.buttons.map((label, idx) => (
                      <button
                        key={label}
                        type="button"
                        className={`hc-btn ${idx === 0 ? 'primary' : ''}`}
                        onClick={() => activeModal.resolve(label)}
                      >
                        {label}
                      </button>
                    ))
                  ) : (
                    <>
                      <button type="button" className="hc-btn" onClick={() => activeModal.resolve(null)}>
                        {t.cancel}
                      </button>
                      <button type="button" className="hc-btn primary" onClick={() => activeModal.resolve(askDraft)}>
                        {t.ok}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Browse Navigation Bar */}
      <div className="hc-stage-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button type="button" className="hc-btn" onClick={() => goToCard(activeCardIndex - 1, 'wipe right')}>
            {t.prev}
          </button>
          <strong data-testid="card-counter">
            {t.cardOf(activeCardIndex + 1, stack.cards.length)}
          </strong>
          <button type="button" className="hc-btn" onClick={() => goToCard(activeCardIndex + 1, 'wipe left')}>
            {t.next}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            className="hc-btn"
            onClick={() => {
              setMode('author');
              setInspectorTab('script');
              const firstScripted = activeCard.objects.find((o) => o.script.trim().length > 0);
              if (firstScripted) setSelectedObjectId(firstScripted.id);
            }}
          >
            <Code2 size={13} /> {t.peekScript}
          </button>
          <span style={{ color: 'var(--hc-ink-muted)', fontSize: 10.5 }}>{t.stageTagline}</span>
        </div>
      </div>
    </main>
  );
}
