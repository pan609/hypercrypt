import { Cpu, FileCode2, GitBranch, Network } from 'lucide-react';
import { useStudio } from '../store/useStudioStore';

export function EngineHud() {
  const {
    t,
    globals,
    stepsExecuted,
    lastRunDurationMs,
    lastHandlerLabel,
    audioPulseNonce,
    lastAudioName,
    activeCard,
    setMode,
    setInspectorTab,
    setSelectedObjectId,
  } = useStudio();

  const globalEntries = Object.entries(globals).filter(([, v]) => v !== '');

  return (
    <section className="hc-engine-hud" aria-label="Live HyperTalk Engine HUD" data-testid="engine-hud">
      <div className="hc-hud-left">
        <span className="hc-hud-pill">
          <Cpu size={12} /> {t.hudEngineLabel}
        </span>

        <span className="hc-hud-status">
          {lastHandlerLabel ? (
            <>
              <strong>{lastHandlerLabel}</strong> · {stepsExecuted} AST ops · {lastRunDurationMs}ms ·{' '}
              <span style={{ color: 'var(--hc-success)', fontWeight: 700 }}>{t.hudZeroEval}</span>
            </>
          ) : (
            <>
              {t.hudReady} · <span style={{ color: 'var(--hc-success)', fontWeight: 700 }}>{t.hudZeroEval}</span>
            </>
          )}
        </span>

        {/* Live Web Audio pulse bars */}
        <div
          key={audioPulseNonce}
          className={`hc-audio-bars ${audioPulseNonce > 0 ? 'pulsing' : ''}`}
          title={lastAudioName ? `Last SFX: ${lastAudioName}` : 'Web Audio Synth'}
          aria-hidden="true"
        >
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>

      <div className="hc-hud-right">
        {globalEntries.slice(0, 3).map(([k, v]) => (
          <span key={k} className="hc-global-chip">
            {k}=<strong>{v}</strong>
          </span>
        ))}

        <button type="button" className="hc-hud-link" onClick={() => setMode('map')}>
          <Network size={11} /> {t.hudOpenMap}
        </button>
        <button type="button" className="hc-hud-link" onClick={() => setMode('markdown')}>
          <FileCode2 size={11} /> {t.hudOpenMd}
        </button>
        <button
          type="button"
          className="hc-hud-link"
          onClick={() => {
            setMode('author');
            setInspectorTab('ast');
            const firstScripted = activeCard.objects.find((o) => o.script.trim().length > 0);
            if (firstScripted) setSelectedObjectId(firstScripted.id);
          }}
        >
          <GitBranch size={11} /> {t.hudInspectAst}
        </button>
      </div>
    </section>
  );
}
