import { CARD_WIDTH, type ButtonObject, type Card, type FieldObject, type Stack, type ThemeId } from './types';

export interface CompileMarkdownOptions {
  title?: string;
  author?: string;
  defaultTheme?: ThemeId;
  id?: string;
}

interface ParsedSection {
  name: string;
  bodyLines: string[];
  links: Array<{ label: string; target: string }>;
  scripts: string[];
  editableNoteLabel?: string;
}

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'stack'
  );
}

function escapeHtString(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * Compiles structured Markdown (incident runbooks, tutorials, branching stories)
 * into a ready-to-play HyperCrypt `.hcstack.json` Stack with auto-laid-out fields,
 * buttons, and generated HyperTalk navigation scripts.
 *
 * Conventions:
 * - `# Stack Title` (optional H1)
 * - `## Card: Card Name` or `## Card Name` starts a card
 * - `- [Button Label -> Target Card Name]` creates a navigation button
 * - `> Note: Field Placeholder` adds an editable notes field on the card
 * - ```hypertalk ... ``` attaches custom HyperTalk to the card script
 */
export function compileMarkdownToStack(markdown: string, options: CompileMarkdownOptions = {}): Stack {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  let title = options.title ?? '';
  const sections: ParsedSection[] = [];
  let current: ParsedSection | null = null;
  let inCodeFence = false;
  let codeFenceLang = '';
  let codeBuffer: string[] = [];

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    if (trimmed.startsWith('```')) {
      if (!inCodeFence) {
        inCodeFence = true;
        codeFenceLang = trimmed.slice(3).trim().toLowerCase();
        codeBuffer = [];
      } else {
        inCodeFence = false;
        if (current) {
          if (codeFenceLang === 'hypertalk' || codeFenceLang === 'ht') {
            current.scripts.push(codeBuffer.join('\n').trim());
          } else {
            current.bodyLines.push(...codeBuffer);
          }
        }
        codeFenceLang = '';
        codeBuffer = [];
      }
      continue;
    }

    if (inCodeFence) {
      codeBuffer.push(rawLine);
      continue;
    }

    if (!current && trimmed.startsWith('# ')) {
      if (!title) {
        title = trimmed.slice(2).trim();
      }
      continue;
    }

    if (trimmed.startsWith('## ')) {
      let name = trimmed.slice(3).trim();
      if (/^card:\s*/i.test(name)) {
        name = name.replace(/^card:\s*/i, '').trim();
      }
      current = {
        name: name || `Card ${sections.length + 1}`,
        bodyLines: [],
        links: [],
        scripts: [],
      };
      sections.push(current);
      continue;
    }

    if (!current) {
      if (trimmed.length > 0) {
        current = {
          name: 'Overview',
          bodyLines: [rawLine],
          links: [],
          scripts: [],
        };
        sections.push(current);
      }
      continue;
    }

    // Parse action link: `- [Label -> Target]` or `[Label -> Target]`
    const linkMatch = trimmed.match(/^(?:[-*]\s+)?\[([^\]]+?)\s*->\s*([^\]]+?)\]$/);
    if (linkMatch) {
      current.links.push({
        label: linkMatch[1].trim(),
        target: linkMatch[2].trim(),
      });
      continue;
    }

    // Parse optional editable note directive: `> Note: ...`
    const noteMatch = trimmed.match(/^>\s*Note:\s*(.+)$/i);
    if (noteMatch) {
      current.editableNoteLabel = noteMatch[1].trim();
      continue;
    }

    current.bodyLines.push(rawLine);
  }

  if (sections.length === 0) {
    sections.push({
      name: 'Card 1',
      bodyLines: ['Empty stack compiled from Markdown.'],
      links: [],
      scripts: [],
    });
  }

  const resolvedTitle = title || 'Compiled Markdown Stack';
  const cards: Card[] = sections.map((sec, idx) => {
    const cardId = `card-${idx + 1}-${slugify(sec.name)}`;
    const bodyText = sec.bodyLines
      .join('\n')
      .replace(/^\n+|\n+$/g, '')
      .trim();

    const objects: Array<FieldObject | ButtonObject> = [];

    // Header title field
    objects.push({
      id: `${cardId}-header`,
      type: 'field',
      name: 'Title',
      x: 24,
      y: 16,
      width: CARD_WIDTH - 48,
      height: 30,
      visible: true,
      style: 'transparent',
      text: `${idx + 1}/${sections.length} · ${sec.name}`,
      locked: true,
      fontSize: 15,
      script: '',
    });

    // Main content body field (adjust height cleanly if 2 button rows are needed)
    const links =
      sec.links.length > 0
        ? sec.links
        : idx < sections.length - 1
          ? [{ label: 'Next Step →', target: sections[idx + 1].name }]
          : [{ label: '↺ Back to Start', target: sections[0].name }];

    const twoRows = links.length > 3;
    const hasNotes = Boolean(sec.editableNoteLabel);
    const bodyHeight = hasNotes ? (twoRows ? 116 : 148) : twoRows ? 176 : 210;
    objects.push({
      id: `${cardId}-body`,
      type: 'field',
      name: 'Body',
      x: 24,
      y: 52,
      width: CARD_WIDTH - 48,
      height: bodyHeight,
      visible: true,
      style: 'scrolling',
      text: bodyText || sec.name,
      locked: true,
      fontSize: 12,
      script: '',
    });

    // Optional editable notes field for live runbooks
    if (sec.editableNoteLabel) {
      objects.push({
        id: `${cardId}-notes`,
        type: 'field',
        name: 'Notes',
        x: 24,
        y: twoRows ? 174 : 208,
        width: CARD_WIDTH - 48,
        height: twoRows ? 56 : 62,
        visible: true,
        style: 'rectangle',
        text: sec.editableNoteLabel,
        locked: false,
        fontSize: 11,
        script: '',
      });
    }

    // Navigation buttons wrapped neatly into rows of up to 3 buttons (no silent dropping!)
    const gap = 10;
    const totalW = CARD_WIDTH - 48;
    const perRow = 3;
    const rows = Math.ceil(links.length / perRow);
    const btnHeight = rows > 1 ? 30 : 34;
    const startY = rows > 1 ? 256 : 286;

    links.forEach((link, bIdx) => {
      const rowIdx = Math.floor(bIdx / perRow);
      const colIdx = bIdx % perRow;
      const itemsInRow = Math.min(perRow, links.length - rowIdx * perRow);
      const btnWidth = Math.floor((totalW - gap * (itemsInRow - 1)) / itemsInRow);
      const targetName = escapeHtString(link.target);
      objects.push({
        id: `${cardId}-btn-${bIdx + 1}`,
        type: 'button',
        name: link.label,
        label: link.label,
        x: 24 + colIdx * (btnWidth + gap),
        y: startY + rowIdx * (btnHeight + 8),
        width: btnWidth,
        height: btnHeight,
        visible: true,
        style: 'roundrect',
        accent: bIdx === 0,
        script: [
          'on mouseUp',
          '  play "click"',
          '  visual effect dissolve',
          `  go to card "${targetName}"`,
          'end mouseUp',
        ].join('\n'),
      });
    });

    return {
      id: cardId,
      name: sec.name,
      script: sec.scripts.join('\n\n'),
      bitmapRle: '',
      objects,
    };
  });

  return {
    schemaVersion: 1,
    id: options.id ?? slugify(resolvedTitle),
    title: resolvedTitle,
    author: options.author ?? 'HyperCrypt Markdown Compiler',
    description: `Compiled from Markdown (${cards.length} interactive cards)`,
    defaultTheme: options.defaultTheme ?? 'classic',
    script: '',
    cards,
  };
}
