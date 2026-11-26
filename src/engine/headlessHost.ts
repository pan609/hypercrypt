import { HyperTalkInterpreter } from './interpreter';
import type { RuntimeHost, Stack, TraceEntry, VisualEffect } from './types';

export interface HeadlessRunInput {
  stack: Stack;
  cardIndex?: number;
  handler?: string;
  targetName?: string;
  initialGlobals?: Record<string, string>;
  askResponses?: string[];
  answerResponses?: string[];
}

export interface HeadlessRunOutput {
  finalCardIndex: number;
  finalCardName: string;
  globals: Record<string, string>;
  it: string;
  fieldTexts: Record<string, string>;
  buttonLabels: Record<string, string>;
  audioPlayed: string[];
  dialogs: Array<{ type: 'ask' | 'answer'; prompt: string; response: string }>;
  trace: TraceEntry[];
  stepsExecuted: number;
  error?: string;
}

export async function runStackHeadless(input: HeadlessRunInput): Promise<HeadlessRunOutput> {
  // Deep clone stack so headless execution never mutates caller's object
  const stack: Stack = JSON.parse(JSON.stringify(input.stack));
  let currentCardIndex = Math.max(0, Math.min(stack.cards.length - 1, input.cardIndex ?? 0));
  const audioPlayed: string[] = [];
  const dialogs: Array<{ type: 'ask' | 'answer'; prompt: string; response: string }> = [];
  const askQueue = [...(input.askResponses ?? [])];
  const answerQueue = [...(input.answerResponses ?? [])];
  const liveGlobals: Record<string, string> = { ...(input.initialGlobals ?? {}) };
  let lifecycleDepth = 0;

  const getCurrentCard = () => stack.cards[currentCardIndex];

  const runLifecycle = async (handlerName: 'openCard' | 'closeCard') => {
    const c = getCurrentCard();
    if (!c || (!c.script.trim() && !stack.script.trim())) return;
    if (lifecycleDepth >= 6) return;
    lifecycleDepth++;
    try {
      const sub = new HyperTalkInterpreter(host, liveGlobals, { fastWait: true });
      await sub.runHandler([c.script, stack.script], handlerName);
    } finally {
      lifecycleDepth--;
    }
  };

  const host: RuntimeHost = {
    getCurrentCardIndex: () => currentCardIndex,
    getCardCount: () => stack.cards.length,
    getCurrentCardName: () => getCurrentCard()?.name ?? '',
    findCardIndexByName: (name) =>
      stack.cards.findIndex((c) => c.name.trim().toLowerCase() === name.trim().toLowerCase()),
    goToCard: async (idx: number, _effect: VisualEffect) => {
      if (idx < 0 || idx >= stack.cards.length) return;
      if (idx !== currentCardIndex) {
        await runLifecycle('closeCard');
      }
      currentCardIndex = idx;
      await runLifecycle('openCard');
    },
    getFieldText: (name) => {
      const f = getCurrentCard()?.objects.find(
        (o) => o.type === 'field' && o.name.trim().toLowerCase() === name.trim().toLowerCase(),
      );
      return f && f.type === 'field' ? f.text : '';
    },
    setFieldText: (name, text) => {
      const f = getCurrentCard()?.objects.find(
        (o) => o.type === 'field' && o.name.trim().toLowerCase() === name.trim().toLowerCase(),
      );
      if (f && f.type === 'field') f.text = text;
    },
    getButtonLabel: (name) => {
      const b = getCurrentCard()?.objects.find(
        (o) => o.type === 'button' && o.name.trim().toLowerCase() === name.trim().toLowerCase(),
      );
      return b && b.type === 'button' ? b.label : '';
    },
    setButtonLabel: (name, label) => {
      const b = getCurrentCard()?.objects.find(
        (o) => o.type === 'button' && o.name.trim().toLowerCase() === name.trim().toLowerCase(),
      );
      if (b && b.type === 'button') b.label = label;
    },
    getButtonChecked: (name) => {
      const b = getCurrentCard()?.objects.find(
        (o) => o.type === 'button' && o.name.trim().toLowerCase() === name.trim().toLowerCase(),
      );
      return b && b.type === 'button' ? Boolean(b.checked) : false;
    },
    setButtonChecked: (name, checked) => {
      const b = getCurrentCard()?.objects.find(
        (o) => o.type === 'button' && o.name.trim().toLowerCase() === name.trim().toLowerCase(),
      );
      if (b && b.type === 'button') b.checked = checked;
    },
    setObjectVisible: (kind, name, visible) => {
      const o = getCurrentCard()?.objects.find(
        (obj) => obj.type === kind && obj.name.trim().toLowerCase() === name.trim().toLowerCase(),
      );
      if (o) o.visible = visible;
    },
    answer: async (prompt, buttons) => {
      const chosen = answerQueue.shift() ?? buttons[0] ?? 'OK';
      dialogs.push({ type: 'answer', prompt, response: chosen });
      return chosen;
    },
    ask: async (prompt, defaultValue) => {
      const val = askQueue.shift() ?? defaultValue;
      dialogs.push({ type: 'ask', prompt, response: val });
      return val;
    },
    play: (sound) => {
      audioPlayed.push(sound);
    },
    wait: async () => {},
  };

  const interpreter = new HyperTalkInterpreter(host, liveGlobals, { fastWait: true });
  const card = getCurrentCard();
  const scripts: string[] = [];

  if (input.targetName && card) {
    const obj = card.objects.find(
      (o) => o.name.trim().toLowerCase() === input.targetName!.trim().toLowerCase(),
    );
    if (obj && obj.script.trim()) {
      scripts.push(obj.script);
    }
  }
  if (card?.script.trim()) scripts.push(card.script);
  if (stack.script.trim()) scripts.push(stack.script);

  const handler = input.handler ?? (input.targetName ? 'mouseUp' : 'openCard');

  let error: string | undefined;
  let it = '';
  let trace: TraceEntry[] = [];
  let stepsExecuted = 0;

  try {
    const res = await interpreter.runHandler(scripts, handler);
    it = res.it;
    trace = res.trace;
    stepsExecuted = res.stepsExecuted;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  const finalCard = getCurrentCard();
  const fieldTexts: Record<string, string> = {};
  const buttonLabels: Record<string, string> = {};
  if (finalCard) {
    for (const obj of finalCard.objects) {
      if (obj.type === 'field') fieldTexts[obj.name] = obj.text;
      if (obj.type === 'button') buttonLabels[obj.name] = obj.label;
    }
  }

  return {
    finalCardIndex: currentCardIndex,
    finalCardName: finalCard?.name ?? '',
    globals: liveGlobals,
    it,
    fieldTexts,
    buttonLabels,
    audioPlayed,
    dialogs,
    trace,
    stepsExecuted,
    error,
  };
}
