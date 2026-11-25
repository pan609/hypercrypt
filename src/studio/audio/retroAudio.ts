import type { ThemeId } from '../../engine/types';

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!sharedAudioCtx) {
    sharedAudioCtx = new Ctor();
  }
  if (sharedAudioCtx.state === 'suspended') {
    void sharedAudioCtx.resume();
  }
  return sharedAudioCtx;
}

export function playRetroSound(sound: string, theme: ThemeId, muted: boolean): void {
  if (muted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.connect(ctx.destination);
    const detune = theme === 'kiroween' ? -18 : 0;

    const tone = (
      freq: number,
      offsetSec: number,
      durSec: number,
      type: OscillatorType = 'triangle',
      vol = 0.12,
    ) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now + offsetSec);
      osc.detune.setValueAtTime(detune, now + offsetSec);
      g.gain.setValueAtTime(vol, now + offsetSec);
      g.gain.exponentialRampToValueAtTime(0.001, now + offsetSec + durSec);
      osc.connect(g);
      g.connect(master);
      osc.start(now + offsetSec);
      osc.stop(now + offsetSec + durSec + 0.02);
    };

    switch (sound.trim().toLowerCase()) {
      case 'click':
        tone(640, 0, 0.022, 'square', 0.06);
        break;
      case 'chime':
        tone(523.25, 0, 0.13, 'triangle', 0.11);
        tone(659.25, 0.085, 0.13, 'triangle', 0.11);
        tone(783.99, 0.17, 0.24, 'triangle', 0.13);
        break;
      case 'unlock':
        tone(440, 0, 0.08, 'square', 0.08);
        tone(659.25, 0.09, 0.22, 'triangle', 0.13);
        break;
      case 'spooky':
      case 'organ':
        tone(293.66, 0, 0.34, 'sawtooth', 0.06);
        tone(349.23, 0.12, 0.34, 'triangle', 0.08);
        tone(415.3, 0.24, 0.44, 'triangle', 0.09);
        break;
      case 'error':
        tone(175, 0, 0.12, 'sawtooth', 0.1);
        tone(142, 0.14, 0.16, 'sawtooth', 0.1);
        break;
      case 'beep':
      default:
        tone(880, 0, 0.11, 'triangle', 0.11);
        break;
    }
  } catch {
    // Web Audio unavailable in headless / test environments
  }
}
