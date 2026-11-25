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
    t,
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
          {t.tabScript}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={inspectorTab === 'debug'}
          className={`hc-tab ${inspectorTab === 'debug' ? 'active' : ''}`}
          onClick={() => setInspectorTab('debug')}
        >
          {t.tabDebug}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={inspectorTab === 'props'}
          className={`hc-tab ${inspectorTab === 'props' ? 'active' : ''}`}
          onClick={() => setInspectorTab('props')}
        >
          {t.tabProps}
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
                {parseCheck.valid ? t.validAst : t.errorsCount(parseCheck.diagnostics.length)}
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
                <Play size={12} /> {t.runHandler(selectedObj ? 'mouseUp' : 'openCard')}
              </button>
              <button
                type="button"
                className="hc-btn"
                onClick={() =>
                  insertSnippet('on mouseUp\n  play "click"\n  visual effect dissolve\n  go to next card\nend mouseUp')
                }
              >
                {t.snipNextCard}
              </button>
              <button
                type="button"
                className="hc-btn"
                onClick={() =>
                  insertSnippet('on mouseUp\n  ask "Your name?" with "Traveler"\n  answer "Hello, " & it & "!"\nend mouseUp')
                }
              >
                {t.snipAsk}
              </button>
            </div>

            <div className="hc-panel-box">
              <div className="hc-section-label">{t.liveGlobals}</div>
              {Object.keys(globals).length === 0 ? (
                <div style={{ color: 'var(--hc-ink-muted)', fontSize: 10.5 }}>{t.noGlobals}</div>
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
                <span>{lastIt ? `"${lastIt}"` : t.emptyVal}</span>
              </div>
            </div>
          </>
        )}

        {inspectorTab === 'debug' && (
          <>
            <div className="hc-panel-box">
              <div className="hc-prop-row">
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 700 }}>
                  <input type="checkbox" checked={stepMode} onChange={(e) => setStepMode(e.target.checked)} />
                  {t.stepModeLabel}
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
                  <SkipForward size={12} /> {t.nextStep}
                </button>
                <button
                  type="button"
                  className="hc-btn"
                  style={{ flex: 1, justifyContent: 'center' }}
                  disabled={pausedLine === null}
                  onClick={continueRun}
                >
                  <Play size={12} /> {t.continueRun}
                </button>
              </div>
              {pausedLine !== null && (
                <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--hc-accent)' }}>
                  {t.pausedAt(pausedLine, pausedSummary ?? '')}
                </div>
              )}
              {runtimeError && (
                <div style={{ fontSize: 10.5, color: 'var(--hc-danger)' }}>
                  {t.runtimeErrorPrefix} {runtimeError}
                </div>
              )}
            </div>

            <div className="hc-panel-box">
              <div className="hc-section-label">{t.sandboxSafety}</div>
              <div className="hc-prop-row">
                <span>{t.astStepsUsed}</span>
                <strong>
                  {stepsExecuted} / {MAX_SANDBOX_STEPS}
                </strong>
              </div>
              <div className="hc-prop-row">
                <span>eval() / new Function</span>
                <strong style={{ color: 'var(--hc-success)' }}>{t.evalDisabled}</strong>
              </div>
            </div>

            <div className="hc-panel-box" style={{ maxHeight: 240, overflowY: 'auto' }}>
              <div className="hc-section-label">{t.execTrace(trace.length)}</div>
              {trace.length === 0 ? (
                <div style={{ color: 'var(--hc-ink-muted)', fontSize: 10.5 }}>{t.noTraceYet}</div>
              ) : (
                trace.map((tr) => (
                  <div key={`${tr.step}-${tr.line}`} className="hc-prop-row">
                    <span>
                      #{tr.step} L{tr.line}: {tr.summary}
                    </span>
                    <span style={{ color: 'var(--hc-ink-muted)' }}>{tr.handler}</span>
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
                <div className="hc-section-label">{t.selectedObj(selectedObj.type)}</div>
                <label className="hc-prop-row">
                  <span>{t.propName}</span>
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
                      <span>{t.propLabel}</span>
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
                      <span>{t.propStyle}</span>
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
                      <span>{t.propAccent}</span>
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
                      <span>{t.propStyle}</span>
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
                      <span>{t.propLocked}</span>
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
                      <span>{t.propText}</span>
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
                  <span>{t.propVisible}</span>
                  <input
                    type="checkbox"
                    checked={selectedObj.visible}
                    onChange={(e) => updateObject(selectedObj.id, (o) => ({ ...o, visible: e.target.checked }))}
                  />
                </label>

                <div className="hc-prop-row">
                  <span>{t.propBounds}</span>
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
                    <Copy size={12} /> {t.duplicate}
                  </button>
                  <button
                    type="button"
                    className="hc-btn danger"
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => deleteObject(selectedObj.id)}
                  >
                    <Trash2 size={12} /> {t.delete}
                  </button>
                </div>
              </div>
            ) : (
              <div className="hc-panel-box">
                <div className="hc-section-label">{t.cardStackProps}</div>
                <label className="hc-prop-row">
                  <span>{t.propStackTitle}</span>
                  <input
                    className="hc-input"
                    style={{ width: 155 }}
                    value={stack.title}
                    onChange={(e) => updateStackMeta({ title: e.target.value })}
                  />
                </label>
                <label className="hc-prop-row">
                  <span>{t.propCardName}</span>
                  <input
                    className="hc-input"
                    style={{ width: 155 }}
                    value={activeCard.name}
                    onChange={(e) => updateActiveCard((c) => ({ ...c, name: e.target.value }), false)}
                  />
                </label>
                <div style={{ color: 'var(--hc-ink-muted)', fontSize: 10.5, marginTop: 4 }}>{t.propsHint}</div>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
