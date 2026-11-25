import { useMemo } from 'react';
import { Copy, Play, SkipForward, Trash2 } from 'lucide-react';
import { MAX_SANDBOX_STEPS } from '../../engine/interpreter';
import { parseScript } from '../../engine/parser';
import type { ButtonStyle, FieldStyle } from '../../engine/types';
import { useStudio } from '../store/useStudioStore';

export function InspectorDrawer() {
  const {
    stack,
    activeCard,
    selectedObjectId,
    inspectorTab,
    globals,
    lastIt,
    trace,
    stepsExecuted,
    runtimeError,
    stepMode,
    pausedLine,
    pausedSummary,
    setInspectorTab,
    setStepMode,
    updateStackMeta,
    updateActiveCard,
    updateObject,
    deleteObject,
    duplicateObject,
    runObjectHandler,
    runCardHandler,
    stepNext,
    continueRun,
  } = useStudio();

  const selectedObj = activeCard.objects.find((o) => o.id === selectedObjectId) ?? null;
  const activeScript = selectedObj ? selectedObj.script : activeCard.script;

  const parseCheck = useMemo(() => {
    if (!activeScript.trim()) return { valid: true, diagnostics: [], handlers: [] as string[] };
    const { program, diagnostics } = parseScript(activeScript);
    return {
      valid: diagnostics.length === 0,
      diagnostics,
      handlers: program.handlers.map((h) => h.name),
    };
  }, [activeScript]);

  const setScriptText = (next: string) => {
    if (selectedObj) {
      updateObject(selectedObj.id, (o) => ({ ...o, script: next }), false);
    } else {
      updateActiveCard((c) => ({ ...c, script: next }), false);
    }
  };

  const insertSnippet = (snippet: string) => {
    const trimmed = activeScript.trim();
    setScriptText(trimmed ? `${trimmed}\n\n${snippet}` : snippet);
  };

  return (
    <aside className="hc-inspector" aria-label="Inspector and HyperTalk Debugger">
      <div className="hc-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={inspectorTab === 'script'}
          className={`hc-tab ${inspectorTab === 'script' ? 'active' : ''}`}
          onClick={() => setInspectorTab('script')}
        >
          Script
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={inspectorTab === 'debug'}
          className={`hc-tab ${inspectorTab === 'debug' ? 'active' : ''}`}
          onClick={() => setInspectorTab('debug')}
        >
          Debug
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={inspectorTab === 'props'}
          className={`hc-tab ${inspectorTab === 'props' ? 'active' : ''}`}
          onClick={() => setInspectorTab('props')}
        >
          Props
        </button>
      </div>

      <div className="hc-inspector-body">
        {inspectorTab === 'script' && (
          <>
            <div className="hc-prop-row">
              <strong>
                {selectedObj ? `${selectedObj.type} "${selectedObj.name}"` : `card "${activeCard.name}"`}
              </strong>
              <span
                data-testid="ast-status"
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: parseCheck.valid ? 'var(--hc-success)' : 'var(--hc-danger)',
                }}
              >
                {parseCheck.valid ? '✓ Valid AST' : `✗ ${parseCheck.diagnostics.length} Error(s)`}
              </span>
            </div>

            <textarea
              aria-label="HyperTalk script editor"
              data-testid="script-editor"
              className="hc-script-textarea"
              spellCheck={false}
              value={activeScript}
              placeholder={'on mouseUp\n  play "chime"\n  go to next card\nend mouseUp'}
              onChange={(e) => setScriptText(e.target.value)}
            />

            {!parseCheck.valid && (
              <div className="hc-panel-box" style={{ borderColor: 'var(--hc-danger)', color: 'var(--hc-danger)' }}>
                {parseCheck.diagnostics.map((d, i) => (
                  <div key={i} style={{ fontSize: 10.5 }}>
                    Line {d.line}, Col {d.column}: {d.message}
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="hc-btn primary"
                disabled={!parseCheck.valid}
                onClick={() => {
                  if (selectedObj) void runObjectHandler(selectedObj.id, 'mouseUp');
                  else void runCardHandler('openCard');
                }}
              >
                <Play size={12} /> Run {selectedObj ? 'mouseUp' : 'openCard'}
              </button>
              <button
                type="button"
                className="hc-btn"
                onClick={() =>
                  insertSnippet('on mouseUp\n  play "click"\n  visual effect dissolve\n  go to next card\nend mouseUp')
                }
              >
                + Next Card
              </button>
              <button
                type="button"
                className="hc-btn"
                onClick={() =>
                  insertSnippet('on mouseUp\n  ask "Your name?" with "Traveler"\n  answer "Hello, " & it & "!"\nend mouseUp')
                }
              >
                + Ask
              </button>
            </div>

            <div className="hc-panel-box">
              <div className="hc-section-label">Live Globals</div>
              {Object.keys(globals).length === 0 ? (
                <div style={{ color: 'var(--hc-ink-muted)', fontSize: 10.5 }}>No global variables set yet.</div>
              ) : (
                Object.entries(globals).map(([k, v]) => (
                  <div key={k} className="hc-prop-row">
                    <span>{k}</span>
                    <strong>{v || '""'}</strong>
                  </div>
                ))
              )}
              <div className="hc-prop-row" style={{ borderTop: '1px dashed var(--hc-border)', paddingTop: 4 }}>
                <span>it</span>
                <span>{lastIt ? `"${lastIt}"` : 'empty'}</span>
              </div>
            </div>
          </>
        )}

        {inspectorTab === 'debug' && (
          <>
            <div className="hc-panel-box">
              <div className="hc-prop-row">
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 700 }}>
                  <input
                    type="checkbox"
                    checked={stepMode}
                    onChange={(e) => setStepMode(e.target.checked)}
                  />
                  Step Mode (Pause Each AST Line)
                </label>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  className="hc-btn primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                  disabled={pausedLine === null}
                  onClick={stepNext}
                >
                  <SkipForward size={12} /> Next Step
                </button>
                <button
                  type="button"
                  className="hc-btn"
                  style={{ flex: 1, justifyContent: 'center' }}
                  disabled={pausedLine === null}
                  onClick={continueRun}
                >
                  <Play size={12} /> Continue
                </button>
              </div>
              {pausedLine !== null && (
                <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--hc-accent)' }}>
                  Paused at Line {pausedLine}: {pausedSummary}
                </div>
              )}
              {runtimeError && (
                <div style={{ fontSize: 10.5, color: 'var(--hc-danger)' }}>Runtime Error: {runtimeError}</div>
              )}
            </div>

            <div className="hc-panel-box">
              <div className="hc-section-label">Sandbox Safety</div>
              <div className="hc-prop-row">
                <span>AST Steps Used</span>
                <strong>
                  {stepsExecuted} / {MAX_SANDBOX_STEPS}
                </strong>
              </div>
              <div className="hc-prop-row">
                <span>eval() / new Function</span>
                <strong style={{ color: 'var(--hc-success)' }}>DISABLED</strong>
              </div>
            </div>

            <div className="hc-panel-box" style={{ maxHeight: 240, overflowY: 'auto' }}>
              <div className="hc-section-label">Execution Trace ({trace.length})</div>
              {trace.length === 0 ? (
                <div style={{ color: 'var(--hc-ink-muted)', fontSize: 10.5 }}>
                  Click any scripted button or run a handler to inspect trace events.
                </div>
              ) : (
                trace.map((t) => (
                  <div key={`${t.step}-${t.line}`} className="hc-prop-row">
                    <span>
                      #{t.step} L{t.line}: {t.summary}
                    </span>
                    <span style={{ color: 'var(--hc-ink-muted)' }}>{t.handler}</span>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {inspectorTab === 'props' && (
          <>
            {selectedObj ? (
              <div className="hc-panel-box">
                <div className="hc-section-label">Selected {selectedObj.type}</div>
                <label className="hc-prop-row">
                  <span>Name</span>
                  <input
                    className="hc-input"
                    style={{ width: 155 }}
                    value={selectedObj.name}
                    onChange={(e) => updateObject(selectedObj.id, (o) => ({ ...o, name: e.target.value }))}
                  />
                </label>

                {selectedObj.type === 'button' ? (
                  <>
                    <label className="hc-prop-row">
                      <span>Label</span>
                      <input
                        className="hc-input"
                        style={{ width: 155 }}
                        value={selectedObj.label}
                        onChange={(e) =>
                          updateObject(selectedObj.id, (o) =>
                            o.type === 'button' ? { ...o, label: e.target.value } : o,
                          )
                        }
                      />
                    </label>
                    <label className="hc-prop-row">
                      <span>Style</span>
                      <select
                        className="hc-input"
                        style={{ width: 155 }}
                        value={selectedObj.style}
                        onChange={(e) =>
                          updateObject(selectedObj.id, (o) =>
                            o.type === 'button' ? { ...o, style: e.target.value as ButtonStyle } : o,
                          )
                        }
                      >
                        <option value="roundrect">Classic Rounded</option>
                        <option value="shadow">Shadow Box</option>
                        <option value="transparent">Invisible Hotspot</option>
                        <option value="checkbox">Checkbox</option>
                      </select>
                    </label>
                    <label className="hc-prop-row">
                      <span>Primary Accent</span>
                      <input
                        type="checkbox"
                        checked={Boolean(selectedObj.accent)}
                        onChange={(e) =>
                          updateObject(selectedObj.id, (o) =>
                            o.type === 'button' ? { ...o, accent: e.target.checked } : o,
                          )
                        }
                      />
                    </label>
                  </>
                ) : (
                  <>
                    <label className="hc-prop-row">
                      <span>Style</span>
                      <select
                        className="hc-input"
                        style={{ width: 155 }}
                        value={selectedObj.style}
                        onChange={(e) =>
                          updateObject(selectedObj.id, (o) =>
                            o.type === 'field' ? { ...o, style: e.target.value as FieldStyle } : o,
                          )
                        }
                      >
                        <option value="rectangle">Rectangle</option>
                        <option value="scrolling">Scrolling Box</option>
                        <option value="transparent">Transparent Label</option>
                      </select>
                    </label>
                    <label className="hc-prop-row">
                      <span>Locked (Read-Only)</span>
                      <input
                        type="checkbox"
                        checked={selectedObj.locked}
                        onChange={(e) =>
                          updateObject(selectedObj.id, (o) =>
                            o.type === 'field' ? { ...o, locked: e.target.checked } : o,
                          )
                        }
                      />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span>Text Content</span>
                      <textarea
                        className="hc-input"
                        rows={4}
                        value={selectedObj.text}
                        onChange={(e) =>
                          updateObject(selectedObj.id, (o) =>
                            o.type === 'field' ? { ...o, text: e.target.value } : o,
                          )
                        }
                      />
                    </label>
                  </>
                )}

                <label className="hc-prop-row">
                  <span>Visible</span>
                  <input
                    type="checkbox"
                    checked={selectedObj.visible}
                    onChange={(e) => updateObject(selectedObj.id, (o) => ({ ...o, visible: e.target.checked }))}
                  />
                </label>

                <div className="hc-prop-row">
                  <span>Bounds</span>
                  <span style={{ color: 'var(--hc-ink-muted)' }}>
                    {selectedObj.x},{selectedObj.y} · {selectedObj.width}×{selectedObj.height}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <button
                    type="button"
                    className="hc-btn"
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => duplicateObject(selectedObj.id)}
                  >
                    <Copy size={12} /> Duplicate
                  </button>
                  <button
                    type="button"
                    className="hc-btn danger"
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => deleteObject(selectedObj.id)}
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            ) : (
              <div className="hc-panel-box">
                <div className="hc-section-label">Card & Stack Properties</div>
                <label className="hc-prop-row">
                  <span>Stack Title</span>
                  <input
                    className="hc-input"
                    style={{ width: 155 }}
                    value={stack.title}
                    onChange={(e) => updateStackMeta({ title: e.target.value })}
                  />
                </label>
                <label className="hc-prop-row">
                  <span>Card Name</span>
                  <input
                    className="hc-input"
                    style={{ width: 155 }}
                    value={activeCard.name}
                    onChange={(e) => updateActiveCard((c) => ({ ...c, name: e.target.value }), false)}
                  />
                </label>
                <div style={{ color: 'var(--hc-ink-muted)', fontSize: 10.5, marginTop: 4 }}>
                  Click any button or field on the card to edit its position, style, or HyperTalk script.
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
