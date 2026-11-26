export type HighlightTokenType = 'keyword' | 'builtin' | 'string' | 'number' | 'comment' | 'operator' | 'plain';

export interface HighlightSpan {
  type: HighlightTokenType;
  text: string;
}

const KEYWORDS = new Set([
  'on',
  'end',
  'global',
  'put',
  'into',
  'before',
  'after',
  'add',
  'subtract',
  'multiply',
  'divide',
  'to',
  'from',
  'by',
  'visual',
  'effect',
  'go',
  'next',
  'prev',
  'previous',
  'first',
  'last',
  'card',
  'cards',
  'show',
  'hide',
  'set',
  'the',
  'of',
  'button',
  'btn',
  'field',
  'fld',
  'answer',
  'ask',
  'with',
  'or',
  'and',
  'not',
  'play',
  'wait',
  'if',
  'then',
  'else',
  'repeat',
  'times',
  'while',
  'exit',
  'return',
  'is',
  'contains',
  'mod',
  'this',
]);

const BUILTINS = new Set([
  'it',
  'empty',
  'space',
  'quote',
  'true',
  'false',
  'random',
  'label',
  'text',
  'checked',
  'number',
  'name',
  'dissolve',
  'wipe',
  'left',
  'right',
  'iris',
  'open',
  'barn',
  'door',
  'milliseconds',
  'seconds',
  'ms',
]);

export function highlightHyperTalkLine(line: string): HighlightSpan[] {
  const spans: HighlightSpan[] = [];
  let i = 0;

  while (i < line.length) {
    // Comment
    if (line[i] === '-' && line[i + 1] === '-') {
      spans.push({ type: 'comment', text: line.slice(i) });
      break;
    }

    // String literal
    if (line[i] === '"') {
      let j = i + 1;
      while (j < line.length) {
        if (line[j] === '\\' && j + 1 < line.length) {
          j += 2;
          continue;
        }
        if (line[j] === '"') {
          j++;
          break;
        }
        j++;
      }
      spans.push({ type: 'string', text: line.slice(i, j) });
      i = j;
      continue;
    }

    // Number
    if (/[0-9]/.test(line[i])) {
      let j = i;
      while (j < line.length && /[0-9.]/.test(line[j])) j++;
      spans.push({ type: 'number', text: line.slice(i, j) });
      i = j;
      continue;
    }

    // Word
    if (/[A-Za-z_]/.test(line[i])) {
      let j = i;
      while (j < line.length && /[A-Za-z0-9_]/.test(line[j])) j++;
      const word = line.slice(i, j);
      const lower = word.toLowerCase();
      if (KEYWORDS.has(lower)) {
        spans.push({ type: 'keyword', text: word });
      } else if (BUILTINS.has(lower)) {
        spans.push({ type: 'builtin', text: word });
      } else {
        spans.push({ type: 'plain', text: word });
      }
      i = j;
      continue;
    }

    // Operators
    if ('+-*/=<>&()'.includes(line[i])) {
      spans.push({ type: 'operator', text: line[i] });
      i++;
      continue;
    }

    // Plain / whitespace
    let j = i + 1;
    while (j < line.length && !/["0-9A-Za-z_+\-*/=<>&()]/.test(line[j])) {
      j++;
    }
    spans.push({ type: 'plain', text: line.slice(i, j) });
    i = j;
  }

  return spans;
}
