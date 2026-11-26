import type { Stack } from '../engine/types';
import type { Locale } from '../studio/i18n/messages';
import { createAtkinsonLabStack } from './atkinsonLab';
import { createAtticMacStack } from './atticMac1987';
import { createProdRunbookStack } from './prodRunbook502';
import { createStarlightRpgStack } from './starlightRpg';

export interface PresetEntry {
  id: string;
  label: Record<Locale, string>;
  tagline: Record<Locale, string>;
  create: (locale?: Locale) => Stack;
}

export const BUILTIN_PRESETS: PresetEntry[] = [
  {
    id: 'attic-mac-1987',
    label: {
      en: 'The Attic Mac of 1987',
      zh: '1987 阁楼老苹果',
    },
    tagline: {
      en: '6-card playful mystery & live tour',
      zh: '6 张卡片的温暖复古解谜与 HyperTalk 导览',
    },
    create: createAtticMacStack,
  },
  {
    id: 'starlight-cavern-rpg',
    label: {
      en: 'Starlight Cavern 1987 (1-Bit RPG)',
      zh: '星光洞窟 1987（1-Bit 迷你 RPG）',
    },
    tagline: {
      en: '6-card branching mini-RPG with HP, Gold & random(6) dice',
      zh: '6 卡多结局迷你 RPG：体力、金币与 random(6) 掷骰',
    },
    create: createStarlightRpgStack,
  },
  {
    id: 'prod-502-runbook',
    label: {
      en: 'Prod 502 Triage Runbook',
      zh: '线上 502 故障排查手册',
    },
    tagline: {
      en: '5-card SRE decision deck (compiled from Markdown)',
      zh: '5 卡 SRE 交互决策树（由 Markdown 直接编译）',
    },
    create: createProdRunbookStack,
  },
  {
    id: 'atkinson-script-lab',
    label: {
      en: 'Atkinson Darkroom & Script Lab',
      zh: 'Atkinson 暗房与脚本实验室',
    },
    tagline: {
      en: '4-card 1-bit dither, retro synth & debugger lab',
      zh: '4 卡 1-Bit 抖动、复古合成器与单步调试实验台',
    },
    create: createAtkinsonLabStack,
  },
];

export function createBlankStack(locale: Locale = 'en'): Stack {
  const isZh = locale === 'zh';
  return {
    schemaVersion: 1,
    id: `custom-stack-${Date.now()}`,
    title: isZh ? '未命名卡片栈' : 'Untitled Stack',
    author: isZh ? '我' : 'You',
    description: isZh ? '全新 512×342 1-Bit HyperCrypt 卡片栈。' : 'A fresh 512×342 1-bit HyperCrypt stack.',
    defaultTheme: 'classic',
    script: '',
    cards: [
      {
        id: 'card-1',
        name: isZh ? '卡片 1' : 'Card 1',
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
            text: isZh
              ? '欢迎来到你的全新 HyperCrypt 卡片！\n\n点击顶部「创作」即可绘制 1-Bit 像素画、上传照片进行 Atkinson 抖动，或添加带脚本的按钮。'
              : 'Welcome to your fresh HyperCrypt card!\n\nSwitch to Author Mode to paint 1-bit pixel art, import a dithered photo, or add scripted buttons.',
            script: '',
          },
          {
            id: 'obj-hello-btn',
            type: 'button',
            name: 'Say Hello',
            label: isZh ? '点我试试！' : 'Click Me!',
            style: 'roundrect',
            accent: true,
            x: 40,
            y: 210,
            width: 150,
            height: 36,
            visible: true,
            script: isZh
              ? 'on mouseUp\n  play "chime"\n  answer "你好！这是你亲手创建的 HyperCrypt 卡片栈！" with "很棒！"\nend mouseUp'
              : 'on mouseUp\n  play "chime"\n  answer "Hello from your new HyperCrypt stack!" with "Nice!"\nend mouseUp',
          },
        ],
      },
    ],
  };
}
