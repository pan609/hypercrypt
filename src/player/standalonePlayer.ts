import { decodeBitmapRle } from '../engine/bitmap';
import { HyperTalkInterpreter } from '../engine/interpreter';
import { CARD_HEIGHT, CARD_WIDTH, type RuntimeHost, type Stack, type ThemeId, type VisualEffect } from '../engine/types';

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    const AudioCtx =
      window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx.state === 'suspended') {
      void sharedAudioCtx.resume();
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

function playSynthSound(sound: string, theme: ThemeId): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    const detune = theme === 'kiroween' ? -18 : 0;

    const note = (freq: number, start: number, dur: number, type: OscillatorType = 'triangle', vol = 0.12) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now + start);
      osc.detune.setValueAtTime(detune, now + start);
      g.gain.setValueAtTime(vol, now + start);
      g.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
      osc.connect(g);
      g.connect(gain);
      osc.start(now + start);
      osc.stop(now + start + dur + 0.02);
    };

    const name = sound.toLowerCase().trim();
    if (name === 'click') note(620, 0, 0.025, 'square', 0.07);
    else if (name === 'chime') {
      note(523.25, 0, 0.14);
      note(659.25, 0.09, 0.14);
      note(783.99, 0.18, 0.24);
    } else if (name === 'unlock') {
      note(440, 0, 0.08, 'square', 0.09);
      note(659.25, 0.09, 0.22, 'triangle', 0.13);
    } else if (name === 'spooky' || name === 'organ') {
      note(293.66, 0, 0.35, 'sawtooth', 0.07);
      note(349.23, 0.12, 0.35, 'triangle', 0.08);
      note(415.3, 0.24, 0.45, 'triangle', 0.09);
    } else if (name === 'error') {
      note(170, 0, 0.12, 'sawtooth', 0.1);
      note(140, 0.14, 0.16, 'sawtooth', 0.1);
    } else {
      note(880, 0, 0.12, 'triangle', 0.1);
    }
  } catch {
    // Ignore audio context autoplay restrictions in headless browsers
  }
}

function bootStandalonePlayer(): void {
  const dataEl = document.getElementById('hc-stack-data');
  if (!dataEl || !dataEl.textContent) return;

  const stack: Stack = JSON.parse(dataEl.textContent);
  let theme: ThemeId =
    (document.documentElement.getAttribute('data-hc-theme') as ThemeId) || stack.defaultTheme || 'classic';
  let currentCardIndex = 0;
  let globals: Record<string, string> = {};
  let busy = false;
  let lifecycleDepth = 0;

  const root = document.getElementById('hc-standalone-root')!;
  const titleEl = document.getElementById('hc-title')!;
  const counterEl = document.getElementById('hc-counter')!;
  const canvas = document.getElementById('hc-canvas') as HTMLCanvasElement;
  const layer = document.getElementById('hc-objects')!;
  const viewport = document.getElementById('hc-viewport')!;
  const modalBackdrop = document.getElementById('hc-modal-backdrop')!;
  const modalText = document.getElementById('hc-modal-text')!;
  const modalInput = document.getElementById('hc-modal-input') as HTMLInputElement;
  const modalActions = document.getElementById('hc-modal-actions')!;
  const themeBtn = document.getElementById('hc-theme-toggle')!;
  const prevBtn = document.getElementById('hc-prev')!;
  const nextBtn = document.getElementById('hc-next')!;

  const applyTheme = (nextTheme: ThemeId) => {
    theme = nextTheme;
    document.documentElement.setAttribute('data-hc-theme', theme);
    root.setAttribute('data-hc-theme', theme);
    themeBtn.textContent = theme === 'classic' ? '1987 Cream' : 'Kiroween Dusk';
    drawBitmap();
  };

  const drawBitmap = () => {
    const card = stack.cards[currentCardIndex];
    const ctx = canvas.getContext('2d');
    if (!ctx || !card) return;
    const bits = decodeBitmapRle(card.bitmapRle);
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
  };

  const openAnswerModal = (prompt: string, buttons: string[]): Promise<string> =>
    new Promise((resolve) => {
      modalText.textContent = prompt;
      modalInput.style.display = 'none';
      modalActions.textContent = '';
      buttons.forEach((label, idx) => {
        const b = document.createElement('button');
        b.className = idx === 0 ? 'hc-modal-btn primary' : 'hc-modal-btn';
        b.textContent = label;
        b.onclick = () => {
          modalBackdrop.classList.remove('open');
          resolve(label);
        };
        modalActions.appendChild(b);
      });
      modalBackdrop.classList.add('open');
    });

  const openAskModal = (prompt: string, defaultValue: string): Promise<string | null> =>
    new Promise((resolve) => {
      modalText.textContent = prompt;
      modalInput.style.display = 'block';
      modalInput.value = defaultValue;
      modalActions.textContent = '';

      const cancel = document.createElement('button');
      cancel.className = 'hc-modal-btn';
      cancel.textContent = 'Cancel';
      cancel.onclick = () => {
        modalBackdrop.classList.remove('open');
        resolve(null);
      };

      const ok = document.createElement('button');
      ok.className = 'hc-modal-btn primary';
      ok.textContent = 'OK';
      ok.onclick = () => {
        modalBackdrop.classList.remove('open');
        resolve(modalInput.value);
      };

      modalInput.onkeydown = (e) => {
        if (e.key === 'Enter') ok.click();
        if (e.key === 'Escape') cancel.click();
      };

      modalActions.appendChild(cancel);
      modalActions.appendChild(ok);
      modalBackdrop.classList.add('open');
      modalInput.focus();
    });

  const runCardLifecycle = async (handlerName: 'openCard' | 'closeCard') => {
    const card = stack.cards[currentCardIndex];
    if (!card || (!card.script.trim() && !stack.script.trim())) return;
    if (lifecycleDepth >= 6) return;
    lifecycleDepth++;
    try {
      const interp = new HyperTalkInterpreter(createHost(), globals);
      const res = await interp.runHandler([card.script, stack.script], handlerName);
      globals = res.globals;
    } finally {
      lifecycleDepth--;
    }
  };

  const navigateToCard = async (idx: number, effect: VisualEffect) => {
    if (idx < 0 || idx >= stack.cards.length) return;
    if (idx !== currentCardIndex) {
      await runCardLifecycle('closeCard');
    }
    currentCardIndex = idx;
    if (effect && effect !== 'none') {
      const cls = `fx-${effect.replace(/\s+/g, '-')}`;
      viewport.classList.remove('fx-dissolve', 'fx-wipe-left', 'fx-wipe-right', 'fx-iris-open', 'fx-barn-door-open');
      void viewport.offsetWidth;
      viewport.classList.add(cls);
    }
    renderCard();
    await runCardLifecycle('openCard');
  };

  const createHost = (): RuntimeHost => ({
    getCurrentCardIndex: () => currentCardIndex,
    getCardCount: () => stack.cards.length,
    getCurrentCardName: () => stack.cards[currentCardIndex]?.name ?? '',
    findCardIndexByName: (name) =>
      stack.cards.findIndex((c) => c.name.trim().toLowerCase() === name.trim().toLowerCase()),
    goToCard: async (idx: number, effect: VisualEffect) => {
      await navigateToCard(idx, effect);
    },
    getFieldText: (name) => {
      const f = stack.cards[currentCardIndex]?.objects.find(
        (o) => o.type === 'field' && o.name.trim().toLowerCase() === name.trim().toLowerCase(),
      );
      return f && f.type === 'field' ? f.text : '';
    },
    setFieldText: (name, text) => {
      const f = stack.cards[currentCardIndex]?.objects.find(
        (o) => o.type === 'field' && o.name.trim().toLowerCase() === name.trim().toLowerCase(),
      );
      if (f && f.type === 'field') {
        f.text = text;
        renderCard();
      }
    },
    getButtonLabel: (name) => {
      const b = stack.cards[currentCardIndex]?.objects.find(
        (o) => o.type === 'button' && o.name.trim().toLowerCase() === name.trim().toLowerCase(),
      );
      return b && b.type === 'button' ? b.label : '';
    },
    setButtonLabel: (name, label) => {
      const b = stack.cards[currentCardIndex]?.objects.find(
        (o) => o.type === 'button' && o.name.trim().toLowerCase() === name.trim().toLowerCase(),
      );
      if (b && b.type === 'button') {
        b.label = label;
        renderCard();
      }
    },
    getButtonChecked: (name) => {
      const b = stack.cards[currentCardIndex]?.objects.find(
        (o) => o.type === 'button' && o.name.trim().toLowerCase() === name.trim().toLowerCase(),
      );
      return b && b.type === 'button' ? Boolean(b.checked) : false;
    },
    setButtonChecked: (name, checked) => {
      const b = stack.cards[currentCardIndex]?.objects.find(
        (o) => o.type === 'button' && o.name.trim().toLowerCase() === name.trim().toLowerCase(),
      );
      if (b && b.type === 'button') {
        b.checked = checked;
        renderCard();
      }
    },
    setObjectVisible: (kind, name, visible) => {
      const o = stack.cards[currentCardIndex]?.objects.find(
        (obj) => obj.type === kind && obj.name.trim().toLowerCase() === name.trim().toLowerCase(),
      );
      if (o) {
        o.visible = visible;
        renderCard();
      }
    },
    answer: openAnswerModal,
    ask: openAskModal,
    play: (sound) => playSynthSound(sound, theme),
    wait: (ms) => new Promise((r) => setTimeout(r, ms)),
  });

  const renderCard = () => {
    const card = stack.cards[currentCardIndex];
    if (!card) return;
    titleEl.textContent = `${stack.title} — ${card.name} (${currentCardIndex + 1}/${stack.cards.length})`;
    counterEl.textContent = `Card ${currentCardIndex + 1} of ${stack.cards.length}`;
    drawBitmap();
    layer.textContent = '';

    for (const obj of card.objects) {
      if (!obj.visible) continue;
      if (obj.type === 'button') {
        const btn = document.createElement('button');
        btn.className = `hc-obj-btn style-${obj.style}${obj.accent ? ' accent' : ''}`;
        btn.style.left = `${(obj.x / CARD_WIDTH) * 100}%`;
        btn.style.top = `${(obj.y / CARD_HEIGHT) * 100}%`;
        btn.style.width = `${(obj.width / CARD_WIDTH) * 100}%`;
        btn.style.height = `${(obj.height / CARD_HEIGHT) * 100}%`;
        btn.setAttribute('aria-label', obj.name);
        if (obj.style === 'checkbox') {
          btn.textContent = `${obj.checked ? '[X]' : '[ ]'} ${obj.label}`;
        } else if (obj.style !== 'transparent') {
          btn.textContent = obj.label;
        }
        btn.onclick = async () => {
          if (busy) return;
          busy = true;
          try {
            if (obj.style === 'checkbox') {
              obj.checked = !obj.checked;
              renderCard();
            }
            const interp = new HyperTalkInterpreter(createHost(), globals);
            const res = await interp.runHandler([obj.script, card.script, stack.script], 'mouseUp');
            globals = res.globals;
          } catch (err) {
            await openAnswerModal(err instanceof Error ? err.message : String(err), ['OK']);
          } finally {
            busy = false;
          }
        };
        layer.appendChild(btn);
      } else {
        if (obj.locked) {
          const div = document.createElement('div');
          div.className = `hc-obj-field style-${obj.style}`;
          div.style.left = `${(obj.x / CARD_WIDTH) * 100}%`;
          div.style.top = `${(obj.y / CARD_HEIGHT) * 100}%`;
          div.style.width = `${(obj.width / CARD_WIDTH) * 100}%`;
          div.style.height = `${(obj.height / CARD_HEIGHT) * 100}%`;
          if (obj.fontSize) div.style.fontSize = `${obj.fontSize}px`;
          div.textContent = obj.text;
          layer.appendChild(div);
        } else {
          const ta = document.createElement('textarea');
          ta.className = `hc-obj-field editable style-${obj.style}`;
          ta.style.left = `${(obj.x / CARD_WIDTH) * 100}%`;
          ta.style.top = `${(obj.y / CARD_HEIGHT) * 100}%`;
          ta.style.width = `${(obj.width / CARD_WIDTH) * 100}%`;
          ta.style.height = `${(obj.height / CARD_HEIGHT) * 100}%`;
          if (obj.fontSize) ta.style.fontSize = `${obj.fontSize}px`;
          ta.value = obj.text;
          ta.oninput = () => {
            obj.text = ta.value;
          };
          layer.appendChild(ta);
        }
      }
    }
  };

  themeBtn.onclick = () => {
    applyTheme(theme === 'classic' ? 'kiroween' : 'classic');
  };

  prevBtn.onclick = () => {
    void navigateToCard((currentCardIndex - 1 + stack.cards.length) % stack.cards.length, 'wipe right');
  };

  nextBtn.onclick = () => {
    void navigateToCard((currentCardIndex + 1) % stack.cards.length, 'wipe left');
  };

  applyTheme(theme);
  renderCard();
  void runCardLifecycle('openCard');
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootStandalonePlayer);
  } else {
    bootStandalonePlayer();
  }
}
