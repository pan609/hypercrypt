import { describe, expect, it } from 'vitest';
import { runStackHeadless } from '../../src/engine/headlessHost';
import { HyperTalkInterpreter, SandboxLimitError } from '../../src/engine/interpreter';
import { parseScript, parseSingleCommand } from '../../src/engine/parser';
import { analyzeStackGraph } from '../../src/engine/stackGraph';
import type { RuntimeHost, Stack } from '../../src/engine/types';
import { validateStack } from '../../src/engine/validator';
import { createAtticMacStack } from '../../src/presets/atticMac1987';
import { createStarlightRpgStack } from '../../src/presets/starlightRpg';

function makeMockHost(): {
  host: RuntimeHost;
  fields: Record<string, string>;
  sounds: string[];
  cardIndex: number;
  lastEffect: string;
} {
  const state = {
    fields: { output: '' } as Record<string, string>,
    buttons: { go: { label: 'Go', checked: false } } as Record<string, { label: string; checked: boolean }>,
    sounds: [] as string[],
    cardIndex: 0,
    lastEffect: 'none',
  };

  const host: RuntimeHost = {
    getCurrentCardIndex: () => state.cardIndex,
    getCardCount: () => 4,
    getCurrentCardName: () => `Card ${state.cardIndex + 1}`,
    findCardIndexByName: (name) => {
      const m = name.match(/card\s*(\d+)/i);
      return m ? Number(m[1]) - 1 : -1;
    },
    goToCard: (idx, effect) => {
      state.cardIndex = idx;
      state.lastEffect = effect;
    },
    getFieldText: (n) => state.fields[n.toLowerCase()] ?? '',
    setFieldText: (n, t) => {
      state.fields[n.toLowerCase()] = t;
    },
    getButtonLabel: (n) => state.buttons[n.toLowerCase()]?.label ?? '',
    setButtonLabel: (n, l) => {
      state.buttons[n.toLowerCase()] = { label: l, checked: false };
    },
    getButtonChecked: (n) => state.buttons[n.toLowerCase()]?.checked ?? false,
    setButtonChecked: (n, c) => {
      state.buttons[n.toLowerCase()] = { label: n, checked: c };
    },
    setObjectVisible: () => {},
    answer: async (_p, btns) => btns[btns.length - 1] ?? 'OK',
    ask: async (_p, def) => def || '1987',
    play: (s) => state.sounds.push(s),
    wait: async () => {},
  };

  return {
    host,
    fields: state.fields,
    sounds: state.sounds,
    get cardIndex() {
      return state.cardIndex;
    },
    get lastEffect() {
      return state.lastEffect;
    },
  };
}

describe('HyperTalk Parser & Lexer', () => {
  it('parses full handler with if/else, repeat, answer with multiple buttons, and comments', () => {
    const src = `
      -- Classic 1987 handler
      on mouseUp
        global score
        put 10 into score
        add 5 to score
        if score >= 15 then
          answer "You win!" with "Yay" or "Replay"
        else
          play "error"
        end if
      end mouseUp
    `;
    const { program, diagnostics } = parseScript(src);
    expect(diagnostics).toEqual([]);
    expect(program.handlers).toHaveLength(1);
    expect(program.handlers[0].name).toBe('mouseup');
  });

  it('reports accurate line and column diagnostics for syntax errors', () => {
    const bad = `on mouseUp\n  put "unterminated\nend mouseUp`;
    const { diagnostics } = parseScript(bad);
    expect(diagnostics.length).toBeGreaterThan(0);
    expect(diagnostics[0].line).toBe(2);
    expect(diagnostics[0].column).toBeGreaterThan(0);
  });

  it('parses single-line Message Box commands', () => {
    const { program, diagnostics } = parseSingleCommand('go to card 3');
    expect(diagnostics).toEqual([]);
    expect(program.topLevelStatements).toHaveLength(1);
    expect(program.topLevelStatements[0].kind).toBe('goCard');
  });
});

describe('HyperTalk Sandboxed Interpreter', () => {
  it('treats object prototype names as ordinary globals in the shared state', async () => {
    const mock = makeMockHost();
    const globals: Record<string, string> = {};
    const interp = new HyperTalkInterpreter(mock.host, globals);
    await interp.runHandler([`on mouseUp
      global constructor, __proto__
      put constructor into field "output"
      put "safe" into __proto__
    end mouseUp`], 'mouseUp');
    expect(mock.fields.output).toBe('');
    expect(globals.__proto__).toBe('safe');
    expect(Object.getPrototypeOf(globals)).toBe(Object.prototype);
  });

  it('executes loops, globals, string concatenation, visual effects, and dialogs', async () => {
    const mock = makeMockHost();
    const interp = new HyperTalkInterpreter(mock.host, {}, { fastWait: true });
    const script = `
      on mouseUp
        global total
        put 0 into total
        repeat with i = 1 to 4
          add i to total
        end repeat
        put "Sum:" && total into field "output"
        ask "Year?" with "1987"
        put " (" & it & ")" after field "output"
        play "chime"
        visual effect iris open
        go to next card
      end mouseUp
    `;
    const res = await interp.runHandler([script], 'mouseUp');
    expect(res.globals.total).toBe('10');
    expect(mock.fields.output).toBe('Sum: 10 (1987)');
    expect(mock.sounds).toEqual(['chime']);
    expect(mock.cardIndex).toBe(1);
    expect(mock.lastEffect).toBe('iris open');
  });

  it('prevents infinite loops via strict AST step budget', async () => {
    const mock = makeMockHost();
    const interp = new HyperTalkInterpreter(mock.host, {}, { maxSteps: 200, fastWait: true });
    const infinite = `
      on mouseUp
        repeat while true
          add 1 to x
        end repeat
      end mouseUp
    `;
    await expect(interp.runHandler([infinite], 'mouseUp')).rejects.toThrow(SandboxLimitError);
  });

  it('prevents infinite recursion via call depth budget', async () => {
    const mock = makeMockHost();
    const interp = new HyperTalkInterpreter(mock.host, {}, { fastWait: true });
    const recursive = `
      on mouseUp
        boom
      end mouseUp
      on boom
        boom
      end boom
    `;
    await expect(interp.runHandler([recursive], 'mouseUp')).rejects.toThrow(SandboxLimitError);
  });

  it('runs The Attic Mac of 1987 Card 1 -> Card 2 puzzle flow headlessly', async () => {
    const stack = createAtticMacStack();
    const step1 = await runStackHeadless({ stack, cardIndex: 0, targetName: 'MacSpirit' });
    expect(step1.error).toBeUndefined();
    expect(step1.globals.floppyloaded).toBe('1');
    expect(step1.audioPlayed).toContain('chime');

    const step2 = await runStackHeadless({
      stack,
      cardIndex: 0,
      targetName: 'Wake HyperCard',
      initialGlobals: step1.globals,
    });
    expect(step2.error).toBeUndefined();
    expect(step2.finalCardName).toBe('Boot Floppy');
    expect(step2.audioPlayed).toContain('unlock');
  });
});

describe('Static Stack Validator', () => {
  it('catches broken go to card targets', () => {
    const broken: Stack = {
      schemaVersion: 1,
      id: 'broken',
      title: 'Broken Stack',
      author: 'Test',
      description: '',
      script: '',
      cards: [
        {
          id: 'c1',
          name: 'Start',
          bitmapRle: '',
          script: '',
          objects: [
            {
              id: 'b1',
              type: 'button',
              name: 'Jump',
              label: 'Jump',
              style: 'roundrect',
              x: 10,
              y: 10,
              width: 100,
              height: 30,
              visible: true,
              script: 'on mouseUp\n  go to card "NonExistent"\nend mouseUp',
            },
          ],
        },
      ],
    };
    const issues = validateStack(broken);
    expect(issues.some((i) => i.message.includes('Broken card link'))).toBe(true);
  });

  it('supports random(n) and builds accurate Stack Flow Graph for Starlight Cavern RPG', async () => {
    const rpg = createStarlightRpgStack('en');
    expect(validateStack(rpg)).toEqual([]);

    const graph = analyzeStackGraph(rpg);
    expect(graph.nodes).toHaveLength(6);
    expect(graph.edges.length).toBeGreaterThanOrEqual(8);
    expect(graph.brokenLinks).toBe(0);
    expect(graph.conditionalBranches).toBeGreaterThan(0);

    // Execute Stardust Alcove random(6) chest roll headlessly WITH NO initialGlobals (verifies P0-2 safe defaults!)
    const rollRun = await runStackHeadless({
      stack: rpg,
      cardIndex: 1,
      targetName: 'Roll Chest',
    });
    expect(rollRun.error).toBeUndefined();
    expect(rollRun.globals.alcoveopened).toBe('yes');
    expect(Number(rollRun.globals.hp)).toBeGreaterThanOrEqual(8);
    expect(Number(rollRun.globals.gold)).toBeGreaterThanOrEqual(7);
  });

  it('triggers closeCard before leaving and openCard after entering in headless host', async () => {
    const lifecycleStack: Stack = {
      schemaVersion: 1,
      id: 'lifecycle-test',
      title: 'Lifecycle',
      author: 'Test',
      description: '',
      script: '',
      cards: [
        {
          id: 'c1',
          name: 'One',
          bitmapRle: '',
          script: 'on closeCard\n  global log\n  put "closed1;" after log\nend closeCard',
          objects: [
            {
              id: 'b1',
              type: 'button',
              name: 'Next',
              label: 'Next',
              style: 'roundrect',
              x: 10,
              y: 10,
              width: 80,
              height: 30,
              visible: true,
              script: 'on mouseUp\n  global log\n  put "before;" into log\n  go to card "Two"\n  put ";after" after log\nend mouseUp',
            },
          ],
        },
        {
          id: 'c2',
          name: 'Two',
          bitmapRle: '',
          script: 'on openCard\n  global log\n  put "opened2" after log\nend openCard',
          objects: [],
        },
      ],
    };

    const res = await runStackHeadless({ stack: lifecycleStack, cardIndex: 0, targetName: 'Next' });
    expect(res.error).toBeUndefined();
    expect(res.finalCardName).toBe('Two');
    expect(res.globals.log).toBe('before;closed1;opened2;after');
  });

  it('propagates live globals into nested openCard on RPG Ending Open Source and Respawn', async () => {
    const rpg = createStarlightRpgStack('en');

    // 1. Card 4 (Golden Vault) -> click Ending Open Source -> Card 5 openCard must render live endingTitle!
    const endingRun = await runStackHeadless({
      stack: rpg,
      cardIndex: 3,
      targetName: 'Ending Open Source',
      initialGlobals: { hp: '8', gold: '9', relic: 'Star Charm' },
    });
    expect(endingRun.error).toBeUndefined();
    expect(endingRun.finalCardName).toBe('Quest Finale');
    expect(endingRun.fieldTexts.EndingCard).toContain('Ending A · Open-Source Resurrector');
    expect(endingRun.fieldTexts.EndingCard).toContain('HP Left: 8');

    // 2. Card 6 (Campfire Rest) -> click Respawn -> Card 1 openCard must show reset HP: 10 (never HP: 0!)
    const respawnRun = await runStackHeadless({
      stack: rpg,
      cardIndex: 5,
      targetName: 'Respawn',
      initialGlobals: { hp: '0', gold: '2', relic: 'None', alcoveopened: 'yes' },
    });
    expect(respawnRun.error).toBeUndefined();
    expect(respawnRun.finalCardName).toBe('Cavern Gate');
    expect(respawnRun.globals.hp).toBe('10');
    expect(respawnRun.fieldTexts.HudStats).toContain('HP: 10');
    expect(respawnRun.fieldTexts.HudStats).toContain('Gold: 5');
  });
});
