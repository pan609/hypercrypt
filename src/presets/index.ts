import type { Stack } from '../engine/types';
import { createAtkinsonLabStack } from './atkinsonLab';
import { createAtticMacStack } from './atticMac1987';
import { createProdRunbookStack } from './prodRunbook502';

export interface PresetEntry {
  id: string;
  label: string;
  tagline: string;
  create: () => Stack;
}

export const BUILTIN_PRESETS: PresetEntry[] = [
  {
    id: 'attic-mac-1987',
    label: 'The Attic Mac of 1987',
    tagline: '6-card playful mystery & live tour',
    create: createAtticMacStack,
  },
  {
    id: 'prod-502-runbook',
    label: 'Prod 502 Triage Runbook',
    tagline: '5-card SRE decision deck (compiled from Markdown)',
    create: createProdRunbookStack,
  },
  {
    id: 'atkinson-script-lab',
    label: 'Atkinson Darkroom & Script Lab',
    tagline: '4-card 1-bit dither, retro synth & debugger lab',
    create: createAtkinsonLabStack,
  },
];

export function createBlankStack(): Stack {
  return {
    schemaVersion: 1,
    id: `custom-stack-${Date.now()}`,
    title: 'Untitled Stack',
    author: 'You',
    description: 'A fresh 512×342 1-bit HyperCrypt stack.',
    defaultTheme: 'classic',
    script: '',
    cards: [
      {
        id: 'card-1',
        name: 'Card 1',
        bitmapRle: '',
        script: '',
        objects: [
          {
            id: 'obj-welcome',
            type: 'field',
            name: 'Notes',
            style: 'rectangle',
            x: 40,
            y: 44,
            width: 432,
            height: 140,
            visible: true,
            locked: false,
            fontSize: 13,
            text: 'Welcome to your fresh HyperCrypt card!\n\nSwitch to Author Mode to paint 1-bit pixel art, import a dithered photo, or add scripted buttons.',
            script: '',
          },
          {
            id: 'obj-hello-btn',
            type: 'button',
            name: 'Say Hello',
            label: 'Click Me!',
            style: 'roundrect',
            accent: true,
            x: 40,
            y: 210,
            width: 150,
            height: 36,
            visible: true,
            script: 'on mouseUp\n  play "chime"\n  answer "Hello from your new HyperCrypt stack!" with "Nice!"\nend mouseUp',
          },
        ],
      },
    ],
  };
}
