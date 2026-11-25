import type { Stack, ThemeId } from './types';

function escapeHtmlText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function safeJsonForScriptTag(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export function exportStackToHtml(
  stack: Stack,
  playerBundleJs: string,
  initialTheme: ThemeId = stack.defaultTheme ?? 'classic',
): string {
  const safeTitle = escapeHtmlText(stack.title || 'HyperCrypt Stack');
  const safeJson = safeJsonForScriptTag(stack);
  const safeBundle = playerBundleJs.replace(/<\/script>/gi, '<\\/script>');

  return `<!DOCTYPE html>
<html lang="en" data-hc-theme="${initialTheme}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${safeTitle} — HyperCrypt Standalone Stack</title>
<style>
  :root {
    --hc-desk-bg: #e7e1d4;
    --hc-desk-dot: #c9c0ae;
    --hc-surface: #fbf8f1;
    --hc-surface-alt: #f2ece0;
    --hc-ink: #24201b;
    --hc-ink-muted: #6e6659;
    --hc-accent: #d96b27;
    --hc-accent-text: #fffdf9;
    --hc-border: #2e2923;
    --hc-shadow: 4px 4px 0 rgba(46, 41, 35, 0.85);
    --hc-card-bg: #fbf8f1;
    --hc-stripe: repeating-linear-gradient(to bottom, #3a332b 0px, #3a332b 1px, transparent 1px, transparent 3px);
  }
  [data-hc-theme="kiroween"] {
    --hc-desk-bg: #151026;
    --hc-desk-dot: #2e2352;
    --hc-surface: #21193a;
    --hc-surface-alt: #2b2149;
    --hc-ink: #f3eeff;
    --hc-ink-muted: #ada0d4;
    --hc-accent: #ff9e44;
    --hc-accent-text: #1b122c;
    --hc-border: #a78bfa;
    --hc-shadow: 0 0 28px rgba(167, 139, 250, 0.28), 4px 4px 0 #0b0718;
    --hc-card-bg: #1b1431;
    --hc-stripe: repeating-linear-gradient(to bottom, #a78bfa 0px, #a78bfa 1px, transparent 1px, transparent 3px);
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    font-family: ui-monospace, "SF Mono", Menlo, Monaco, Consolas, monospace;
    background-color: var(--hc-desk-bg);
    background-image: radial-gradient(var(--hc-desk-dot) 1.2px, transparent 0);
    background-size: 8px 8px;
    color: var(--hc-ink);
  }
  #hc-standalone-root {
    width: 100%;
    max-width: 780px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .hc-window {
    background: var(--hc-surface);
    border: 2px solid var(--hc-border);
    border-radius: 6px;
    box-shadow: var(--hc-shadow);
    overflow: hidden;
  }
  .hc-titlebar {
    height: 30px;
    border-bottom: 2px solid var(--hc-border);
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 10px;
    background: var(--hc-surface-alt);
    font-size: 12px;
    font-weight: 700;
  }
  .hc-stripes { flex: 1; height: 11px; background-image: var(--hc-stripe); opacity: 0.55; }
  #hc-viewport {
    position: relative;
    width: 100%;
    aspect-ratio: 512 / 342;
    background: var(--hc-card-bg);
    overflow: hidden;
  }
  #hc-canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    image-rendering: pixelated;
  }
  #hc-objects { position: absolute; inset: 0; }
  .hc-obj-btn {
    position: absolute;
    font-family: inherit;
    font-size: 12px;
    font-weight: 700;
    color: var(--hc-ink);
    background: var(--hc-surface);
    border: 1.5px solid var(--hc-border);
    border-radius: 6px;
    box-shadow: 2px 2px 0 var(--hc-border);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px 8px;
  }
  .hc-obj-btn.accent { background: var(--hc-accent); color: var(--hc-accent-text); }
  .hc-obj-btn.style-shadow { border-radius: 2px; box-shadow: 3px 3px 0 var(--hc-border); }
  .hc-obj-btn.style-transparent { background: transparent; border-color: transparent; box-shadow: none; }
  .hc-obj-btn.style-checkbox { justify-content: flex-start; border-color: transparent; background: transparent; box-shadow: none; }
  .hc-obj-field {
    position: absolute;
    font-family: inherit;
    font-size: 12px;
    line-height: 1.48;
    color: var(--hc-ink);
    background: var(--hc-card-bg);
    border: 1.5px solid var(--hc-border);
    border-radius: 4px;
    padding: 7px 9px;
    white-space: pre-wrap;
    overflow: auto;
    box-shadow: 2px 2px 0 var(--hc-border);
  }
  .hc-obj-field.style-transparent { background: transparent; border-color: transparent; box-shadow: none; padding: 2px 4px; font-weight: 700; }
  .hc-obj-field.editable { resize: none; outline: none; }
  .hc-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 8px 12px;
    background: var(--hc-surface);
    border: 2px solid var(--hc-border);
    border-radius: 6px;
    box-shadow: 2px 2px 0 var(--hc-border);
    font-size: 12px;
  }
  .hc-pill {
    border: 1.5px solid var(--hc-border);
    border-radius: 5px;
    background: var(--hc-surface-alt);
    color: var(--hc-ink);
    font-family: inherit;
    font-size: 11px;
    font-weight: 700;
    padding: 4px 10px;
    cursor: pointer;
  }
  .hc-pill:hover { background: var(--hc-accent); color: var(--hc-accent-text); }
  #hc-modal-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(15, 10, 25, 0.38);
    display: none;
    align-items: center;
    justify-content: center;
    padding: 20px;
    z-index: 20;
  }
  #hc-modal-backdrop.open { display: flex; }
  .hc-modal {
    width: 78%;
    background: var(--hc-surface);
    border: 2px solid var(--hc-border);
    border-radius: 6px;
    outline: 1.5px solid var(--hc-border);
    outline-offset: -5px;
    padding: 16px 18px;
    box-shadow: var(--hc-shadow);
  }
  #hc-modal-text { margin: 0 0 12px; font-size: 12.5px; line-height: 1.5; white-space: pre-wrap; }
  #hc-modal-input {
    width: 100%;
    margin-bottom: 12px;
    padding: 6px 8px;
    border: 1.5px solid var(--hc-border);
    border-radius: 4px;
    background: var(--hc-card-bg);
    color: var(--hc-ink);
    font-family: inherit;
    font-size: 12.5px;
  }
  #hc-modal-actions { display: flex; justify-content: flex-end; gap: 8px; }
  .hc-modal-btn {
    border: 1.5px solid var(--hc-border);
    border-radius: 6px;
    background: var(--hc-surface-alt);
    color: var(--hc-ink);
    font-family: inherit;
    font-size: 11.5px;
    font-weight: 700;
    padding: 5px 14px;
    cursor: pointer;
  }
  .hc-modal-btn.primary { background: var(--hc-accent); color: var(--hc-accent-text); outline: 1.5px solid var(--hc-border); outline-offset: 1px; }
  .fx-dissolve { animation: hcDissolve 280ms steps(6, end); }
  .fx-wipe-left { animation: hcWipeLeft 300ms ease-out; }
  .fx-wipe-right { animation: hcWipeRight 300ms ease-out; }
  .fx-iris-open { animation: hcIris 320ms ease-out; }
  .fx-barn-door-open { animation: hcBarn 320ms ease-out; }
  @keyframes hcDissolve { from { opacity: 0.15; filter: contrast(1.4); } to { opacity: 1; filter: none; } }
  @keyframes hcWipeLeft { from { clip-path: inset(0 0 0 100%); } to { clip-path: inset(0 0 0 0); } }
  @keyframes hcWipeRight { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }
  @keyframes hcIris { from { clip-path: inset(45% 45% 45% 45%); } to { clip-path: inset(0 0 0 0); } }
  @keyframes hcBarn { from { clip-path: inset(0 50% 0 50%); } to { clip-path: inset(0 0 0 0); } }
</style>
</head>
<body>
  <div id="hc-standalone-root" data-hc-theme="${initialTheme}">
    <div class="hc-window">
      <div class="hc-titlebar">
        <div class="hc-stripes"></div>
        <span id="hc-title">${safeTitle}</span>
        <div class="hc-stripes"></div>
      </div>
      <div id="hc-viewport">
        <canvas id="hc-canvas" width="512" height="342"></canvas>
        <div id="hc-objects"></div>
        <div id="hc-modal-backdrop">
          <div class="hc-modal">
            <p id="hc-modal-text"></p>
            <input id="hc-modal-input" type="text" style="display:none;" />
            <div id="hc-modal-actions"></div>
          </div>
        </div>
      </div>
    </div>
    <div class="hc-bar">
      <div style="display:flex;align-items:center;gap:8px;">
        <button id="hc-prev" class="hc-pill">◀ Prev</button>
        <span id="hc-counter" style="font-weight:700;"></span>
        <button id="hc-next" class="hc-pill">Next ▶</button>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <button id="hc-theme-toggle" class="hc-pill"></button>
        <span style="opacity:0.7;font-size:11px;">Exported by HyperCrypt · Runs Offline Forever</span>
      </div>
    </div>
  </div>
  <script id="hc-stack-data" type="application/json">${safeJson}</script>
  <script>${safeBundle}</script>
</body>
</html>`;
}
