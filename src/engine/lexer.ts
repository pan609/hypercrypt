import type { ParseDiagnostic } from './types';

export type TokenKind =
  | 'word'
  | 'number'
  | 'string'
  | 'op'
  | 'lparen'
  | 'rparen'
  | 'comma'
  | 'newline'
  | 'eof';

export interface Token {
  kind: TokenKind;
  value: string;
  lower: string;
  line: number;
  col: number;
}

export interface LexResult {
  tokens: Token[];
  diagnostics: ParseDiagnostic[];
}

export function tokenize(source: string): LexResult {
  const tokens: Token[] = [];
  const diagnostics: ParseDiagnostic[] = [];
  let i = 0;
  let line = 1;
  let col = 1;

  const push = (kind: TokenKind, value: string, startLine: number, startCol: number) => {
    tokens.push({
      kind,
      value,
      lower: kind === 'word' ? value.toLowerCase() : value,
      line: startLine,
      col: startCol,
    });
  };

  while (i < source.length) {
    const ch = source[i];

    // Carriage return / newline
    if (ch === '\r') {
      if (source[i + 1] === '\n') i++;
      push('newline', '\n', line, col);
      i++;
      line++;
      col = 1;
      continue;
    }
    if (ch === '\n') {
      push('newline', '\n', line, col);
      i++;
      line++;
      col = 1;
      continue;
    }

    // Horizontal whitespace
    if (ch === ' ' || ch === '\t') {
      i++;
      col++;
      continue;
    }

    // HyperTalk line comments: -- ...
    if (ch === '-' && source[i + 1] === '-') {
      while (i < source.length && source[i] !== '\n' && source[i] !== '\r') {
        i++;
        col++;
      }
      continue;
    }

    // Line continuation character (¬ or \)
    if (ch === '¬' || (ch === '\\' && (source[i + 1] === '\n' || source[i + 1] === '\r'))) {
      i++;
      col++;
      if (source[i] === '\r') i++;
      if (source[i] === '\n') {
        i++;
        line++;
        col = 1;
      }
      continue;
    }

    // String literal
    if (ch === '"') {
      const startLine = line;
      const startCol = col;
      i++;
      col++;
      let out = '';
      let closed = false;
      while (i < source.length) {
        const c = source[i];
        if (c === '\n' || c === '\r') {
          break;
        }
        if (c === '\\' && i + 1 < source.length) {
          const next = source[i + 1];
          if (next === 'n') out += '\n';
          else if (next === 't') out += '\t';
          else if (next === '"') out += '"';
          else if (next === '\\') out += '\\';
          else out += next;
          i += 2;
          col += 2;
          continue;
        }
        if (c === '"') {
          i++;
          col++;
          closed = true;
          break;
        }
        out += c;
        i++;
        col++;
      }
      if (!closed) {
        diagnostics.push({
          line: startLine,
          column: startCol,
          message: 'Unterminated string literal',
        });
      }
      push('string', out, startLine, startCol);
      continue;
    }

    // Number literal
    if (/[0-9]/.test(ch)) {
      const startLine = line;
      const startCol = col;
      let num = '';
      let hasDot = false;
      while (i < source.length) {
        const c = source[i];
        if (/[0-9]/.test(c)) {
          num += c;
          i++;
          col++;
        } else if (c === '.' && !hasDot && /[0-9]/.test(source[i + 1] ?? '')) {
          hasDot = true;
          num += c;
          i++;
          col++;
        } else {
          break;
        }
      }
      push('number', num, startLine, startCol);
      continue;
    }

    // Identifier / Keyword
    if (/[A-Za-z_]/.test(ch)) {
      const startLine = line;
      const startCol = col;
      let word = '';
      while (i < source.length && /[A-Za-z0-9_]/.test(source[i])) {
        word += source[i];
        i++;
        col++;
      }
      push('word', word, startLine, startCol);
      continue;
    }

    // Punctuation & Operators
    const startLine = line;
    const startCol = col;
    if (ch === '(') {
      push('lparen', '(', startLine, startCol);
      i++;
      col++;
      continue;
    }
    if (ch === ')') {
      push('rparen', ')', startLine, startCol);
      i++;
      col++;
      continue;
    }
    if (ch === ',') {
      push('comma', ',', startLine, startCol);
      i++;
      col++;
      continue;
    }

    const two = source.slice(i, i + 2);
    if (two === '&&' || two === '<=' || two === '>=' || two === '<>' || two === '!=') {
      push('op', two, startLine, startCol);
      i += 2;
      col += 2;
      continue;
    }

    if ('+-*/=<>&'.includes(ch)) {
      push('op', ch, startLine, startCol);
      i++;
      col++;
      continue;
    }

    diagnostics.push({
      line: startLine,
      column: startCol,
      message: `Unexpected character '${ch}'`,
    });
    i++;
    col++;
  }

  push('eof', '', line, col);
  return { tokens, diagnostics };
}
