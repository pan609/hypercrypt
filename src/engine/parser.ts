import { tokenize, type Token } from './lexer';
import type {
  ContainerTarget,
  ExprNode,
  HandlerNode,
  ParseDiagnostic,
  ProgramNode,
  PutMode,
  StatementNode,
  VisualEffect,
} from './types';

export interface ParseResult {
  program: ProgramNode;
  diagnostics: ParseDiagnostic[];
}

class Parser {
  private readonly tokens: Token[];
  private pos = 0;
  public readonly diagnostics: ParseDiagnostic[];

  constructor(tokens: Token[], initialDiagnostics: ParseDiagnostic[]) {
    this.tokens = tokens;
    this.diagnostics = [...initialDiagnostics];
  }

  private peek(offset = 0): Token {
    return this.tokens[Math.min(this.pos + offset, this.tokens.length - 1)];
  }

  private advance(): Token {
    const tok = this.peek();
    if (this.pos < this.tokens.length - 1) this.pos++;
    return tok;
  }

  private skipNewlines(): void {
    while (this.peek().kind === 'newline') {
      this.advance();
    }
  }

  private atLineEnd(): boolean {
    const k = this.peek().kind;
    return k === 'newline' || k === 'eof';
  }

  private isWord(word: string, offset = 0): boolean {
    const tok = this.peek(offset);
    return tok.kind === 'word' && tok.lower === word;
  }

  private matchWord(word: string): boolean {
    if (this.isWord(word)) {
      this.advance();
      return true;
    }
    return false;
  }

  private expectWord(word: string, message?: string): boolean {
    if (this.matchWord(word)) return true;
    const tok = this.peek();
    this.diagnostics.push({
      line: tok.line,
      column: tok.col,
      message: message ?? `Expected '${word}', found '${tok.value || tok.kind}'`,
    });
    return false;
  }

  private syncToNextLine(): void {
    while (!this.atLineEnd()) {
      this.advance();
    }
    if (this.peek().kind === 'newline') {
      this.advance();
    }
  }

  public parseProgram(allowTopLevel = false): ProgramNode {
    const handlers: HandlerNode[] = [];
    const topLevelStatements: StatementNode[] = [];

    this.skipNewlines();
    while (this.peek().kind !== 'eof') {
      if (this.isWord('on')) {
        const h = this.parseHandler();
        if (h) handlers.push(h);
      } else if (allowTopLevel) {
        const stmt = this.parseStatement();
        if (stmt) topLevelStatements.push(stmt);
      } else {
        const tok = this.peek();
        this.diagnostics.push({
          line: tok.line,
          column: tok.col,
          message: `Expected 'on <handlerName>' at top level, found '${tok.value}'`,
        });
        this.syncToNextLine();
      }
      this.skipNewlines();
    }

    return { handlers, topLevelStatements };
  }

  private parseHandler(): HandlerNode | null {
    const startTok = this.advance(); // 'on'
    const nameTok = this.peek();
    if (nameTok.kind !== 'word') {
      this.diagnostics.push({
        line: nameTok.line,
        column: nameTok.col,
        message: 'Expected handler name after "on"',
      });
      this.syncToNextLine();
      return null;
    }
    this.advance();

    const params: string[] = [];
    while (!this.atLineEnd()) {
      const p = this.peek();
      if (p.kind === 'word') {
        params.push(p.lower);
        this.advance();
        if (this.peek().kind === 'comma') {
          this.advance();
        }
      } else {
        this.diagnostics.push({
          line: p.line,
          column: p.col,
          message: `Unexpected token '${p.value}' in handler parameter list`,
        });
        this.syncToNextLine();
        break;
      }
    }
    if (this.peek().kind === 'newline') this.advance();

    const body = this.parseBlock((tok) => tok.kind === 'word' && tok.lower === 'end');

    if (this.matchWord('end')) {
      const endName = this.peek();
      if (endName.kind === 'word') {
        this.advance();
        if (endName.lower !== nameTok.lower) {
          this.diagnostics.push({
            line: endName.line,
            column: endName.col,
            message: `Expected 'end ${nameTok.value}', found 'end ${endName.value}'`,
          });
        }
      } else {
        this.diagnostics.push({
          line: endName.line,
          column: endName.col,
          message: `Expected handler name '${nameTok.value}' after 'end'`,
        });
      }
      this.syncToNextLine();
    } else {
      this.diagnostics.push({
        line: startTok.line,
        column: startTok.col,
        message: `Missing 'end ${nameTok.value}' for handler`,
      });
    }

    return {
      name: nameTok.lower,
      params,
      body,
      line: startTok.line,
    };
  }

  private parseBlock(stopCheck: (tok: Token, nextTok: Token) => boolean): StatementNode[] {
    const stmts: StatementNode[] = [];
    this.skipNewlines();
    while (this.peek().kind !== 'eof') {
      if (stopCheck(this.peek(), this.peek(1))) {
        break;
      }
      const stmt = this.parseStatement();
      if (stmt) stmts.push(stmt);
      this.skipNewlines();
    }
    return stmts;
  }

  private parseStatement(): StatementNode | null {
    const tok = this.peek();
    if (tok.kind !== 'word') {
      this.diagnostics.push({
        line: tok.line,
        column: tok.col,
        message: `Unexpected token '${tok.value || tok.kind}' at start of statement`,
      });
      this.syncToNextLine();
      return null;
    }

    switch (tok.lower) {
      case 'global':
        return this.parseGlobal();
      case 'put':
        return this.parsePut();
      case 'add':
      case 'subtract':
      case 'multiply':
      case 'divide':
        return this.parseMath();
      case 'visual':
        return this.parseVisualEffect();
      case 'go':
        return this.parseGo();
      case 'show':
      case 'hide':
        return this.parseVisibility();
      case 'set':
        return this.parseSetProp();
      case 'answer':
        return this.parseAnswer();
      case 'ask':
        return this.parseAsk();
      case 'play':
        return this.parsePlay();
      case 'wait':
        return this.parseWait();
      case 'if':
        return this.parseIf();
      case 'repeat':
        return this.parseRepeat();
      case 'exit':
        return this.parseExit();
      case 'return':
        return this.parseReturn();
      default:
        return this.parseCall();
    }
  }

  private parseGlobal(): StatementNode {
    const tok = this.advance();
    const names: string[] = [];
    while (!this.atLineEnd()) {
      const n = this.peek();
      if (n.kind === 'word') {
        names.push(n.lower);
        this.advance();
        if (this.peek().kind === 'comma') this.advance();
      } else {
        this.diagnostics.push({
          line: n.line,
          column: n.col,
          message: `Expected variable name in global declaration, found '${n.value}'`,
        });
        break;
      }
    }
    this.syncToNextLine();
    return { kind: 'global', names, line: tok.line };
  }

  private parseContainerTarget(): ContainerTarget | null {
    if (this.matchWord('field') || this.matchWord('fld')) {
      const nameExpr = this.parsePrimary();
      return { kind: 'field', nameExpr };
    }
    const tok = this.peek();
    if (tok.kind === 'word') {
      this.advance();
      return { kind: 'variable', name: tok.lower };
    }
    this.diagnostics.push({
      line: tok.line,
      column: tok.col,
      message: `Expected variable or field target, found '${tok.value || tok.kind}'`,
    });
    return null;
  }

  private parsePut(): StatementNode | null {
    const tok = this.advance(); // 'put'
    const value = this.parseExpr();
    let mode: PutMode | null = null;
    if (this.matchWord('into')) mode = 'into';
    else if (this.matchWord('before')) mode = 'before';
    else if (this.matchWord('after')) mode = 'after';

    if (!mode) {
      const cur = this.peek();
      this.diagnostics.push({
        line: cur.line,
        column: cur.col,
        message: `Expected 'into', 'before', or 'after' in put statement`,
      });
      this.syncToNextLine();
      return null;
    }

    const target = this.parseContainerTarget();
    this.syncToNextLine();
    if (!target) return null;
    return { kind: 'put', value, mode, target, line: tok.line };
  }

  private parseMath(): StatementNode | null {
    const tok = this.advance();
    const op = tok.lower as 'add' | 'subtract' | 'multiply' | 'divide';
    if (op === 'add' || op === 'subtract') {
      const value = this.parseExpr();
      const prep = op === 'add' ? 'to' : 'from';
      this.expectWord(prep, `Expected '${prep}' in ${op} statement`);
      const target = this.parseContainerTarget();
      this.syncToNextLine();
      if (!target) return null;
      return { kind: 'math', op, value, target, line: tok.line };
    } else {
      const target = this.parseContainerTarget();
      this.expectWord('by', `Expected 'by' in ${op} statement`);
      const value = this.parseExpr();
      this.syncToNextLine();
      if (!target) return null;
      return { kind: 'math', op, value, target, line: tok.line };
    }
  }

  private parseVisualEffect(): StatementNode | null {
    const tok = this.advance(); // 'visual'
    this.matchWord('effect');
    const words: string[] = [];
    while (!this.atLineEnd() && this.peek().kind === 'word') {
      words.push(this.advance().lower);
    }
    this.syncToNextLine();
    const joined = words.join(' ');
    const valid: Record<string, VisualEffect> = {
      dissolve: 'dissolve',
      'wipe left': 'wipe left',
      'wipe right': 'wipe right',
      'iris open': 'iris open',
      'barn door open': 'barn door open',
      none: 'none',
    };
    const effect = valid[joined];
    if (!effect) {
      this.diagnostics.push({
        line: tok.line,
        column: tok.col,
        message: `Unknown visual effect '${joined}'. Supported: dissolve, wipe left, wipe right, iris open, barn door open`,
      });
      return null;
    }
    return { kind: 'visualEffect', effect, line: tok.line };
  }

  private parseGo(): StatementNode | null {
    const tok = this.advance(); // 'go'
    this.matchWord('to');

    if (this.matchWord('next')) {
      this.matchWord('card');
      this.syncToNextLine();
      return { kind: 'goCard', target: { mode: 'relative', dir: 'next' }, line: tok.line };
    }
    if (this.matchWord('prev') || this.matchWord('previous')) {
      this.matchWord('card');
      this.syncToNextLine();
      return { kind: 'goCard', target: { mode: 'relative', dir: 'prev' }, line: tok.line };
    }
    if (this.matchWord('first')) {
      this.matchWord('card');
      this.syncToNextLine();
      return { kind: 'goCard', target: { mode: 'relative', dir: 'first' }, line: tok.line };
    }
    if (this.matchWord('last')) {
      this.matchWord('card');
      this.syncToNextLine();
      return { kind: 'goCard', target: { mode: 'relative', dir: 'last' }, line: tok.line };
    }

    this.expectWord('card', `Expected 'next', 'prev', 'first', 'last', or 'card <target>' after 'go'`);
    const expr = this.parseExpr();
    this.syncToNextLine();
    return { kind: 'goCard', target: { mode: 'expr', expr }, line: tok.line };
  }

  private parseVisibility(): StatementNode | null {
    const tok = this.advance();
    const visible = tok.lower === 'show';
    let objectKind: 'button' | 'field' | null = null;
    if (this.matchWord('button') || this.matchWord('btn')) objectKind = 'button';
    else if (this.matchWord('field') || this.matchWord('fld')) objectKind = 'field';
    if (!objectKind) {
      const cur = this.peek();
      this.diagnostics.push({
        line: cur.line,
        column: cur.col,
        message: `Expected 'button' or 'field' after '${tok.lower}'`,
      });
      this.syncToNextLine();
      return null;
    }
    const nameExpr = this.parseExpr();
    this.syncToNextLine();
    return { kind: 'visibility', visible, objectKind, nameExpr, line: tok.line };
  }

  private parseSetProp(): StatementNode | null {
    const tok = this.advance(); // 'set'
    this.matchWord('the');
    const propTok = this.peek();
    let prop: 'label' | 'text' | 'checked' | null = null;
    if (propTok.kind === 'word' && (propTok.lower === 'label' || propTok.lower === 'text' || propTok.lower === 'checked')) {
      prop = propTok.lower;
      this.advance();
    } else {
      this.diagnostics.push({
        line: propTok.line,
        column: propTok.col,
        message: `Expected 'label', 'text', or 'checked' after 'set the'`,
      });
      this.syncToNextLine();
      return null;
    }

    this.expectWord('of');
    let objectKind: 'button' | 'field' | null = null;
    if (this.matchWord('button') || this.matchWord('btn')) objectKind = 'button';
    else if (this.matchWord('field') || this.matchWord('fld')) objectKind = 'field';
    if (!objectKind) {
      const cur = this.peek();
      this.diagnostics.push({
        line: cur.line,
        column: cur.col,
        message: `Expected 'button' or 'field' in set statement`,
      });
      this.syncToNextLine();
      return null;
    }

    const nameExpr = this.parsePrimary();
    this.expectWord('to');
    const value = this.parseExpr();
    this.syncToNextLine();
    return { kind: 'setProp', prop, objectKind, nameExpr, value, line: tok.line };
  }

  private parseAnswer(): StatementNode {
    const tok = this.advance(); // 'answer'
    const prompt = this.parseConcat();
    const buttons: ExprNode[] = [];
    if (this.matchWord('with')) {
      buttons.push(this.parseConcat());
      while (this.matchWord('or')) {
        buttons.push(this.parseConcat());
      }
    }
    this.syncToNextLine();
    return { kind: 'answer', prompt, buttons, line: tok.line };
  }

  private parseAsk(): StatementNode {
    const tok = this.advance(); // 'ask'
    const prompt = this.parseConcat();
    let defaultValue: ExprNode | undefined;
    if (this.matchWord('with')) {
      defaultValue = this.parseConcat();
    }
    this.syncToNextLine();
    return { kind: 'ask', prompt, defaultValue, line: tok.line };
  }

  private parsePlay(): StatementNode {
    const tok = this.advance(); // 'play'
    const sound = this.parseExpr();
    this.syncToNextLine();
    return { kind: 'play', sound, line: tok.line };
  }

  private parseWait(): StatementNode {
    const tok = this.advance(); // 'wait'
    const amount = this.parseExpr();
    let unit: 'ms' | 's' = 's';
    if (this.matchWord('milliseconds') || this.matchWord('millisecond') || this.matchWord('ms')) {
      unit = 'ms';
    } else if (this.matchWord('seconds') || this.matchWord('second') || this.matchWord('secs') || this.matchWord('sec')) {
      unit = 's';
    }
    this.syncToNextLine();
    return { kind: 'wait', amount, unit, line: tok.line };
  }

  private parseIf(): StatementNode {
    const tok = this.advance(); // 'if'
    const condition = this.parseExpr();
    this.expectWord('then', `Expected 'then' after 'if' condition`);

    // Single-line if: `if x > 1 then go to next card`
    if (!this.atLineEnd()) {
      const single = this.parseStatement();
      return {
        kind: 'if',
        condition,
        thenBranch: single ? [single] : [],
        elseBranch: [],
        line: tok.line,
      };
    }

    if (this.peek().kind === 'newline') this.advance();

    const thenBranch = this.parseBlock(
      (t, next) =>
        (t.kind === 'word' && t.lower === 'else') ||
        (t.kind === 'word' && t.lower === 'end' && next.kind === 'word' && next.lower === 'if'),
    );

    let elseBranch: StatementNode[] = [];
    if (this.matchWord('else')) {
      if (this.isWord('if')) {
        // else if chain -> nested if
        elseBranch = [this.parseIf()];
        return { kind: 'if', condition, thenBranch, elseBranch, line: tok.line };
      }
      if (this.peek().kind === 'newline') this.advance();
      elseBranch = this.parseBlock(
        (t, next) => t.kind === 'word' && t.lower === 'end' && next.kind === 'word' && next.lower === 'if',
      );
    }

    if (this.matchWord('end') && this.matchWord('if')) {
      this.syncToNextLine();
    } else {
      this.diagnostics.push({
        line: tok.line,
        column: tok.col,
        message: `Missing 'end if' for 'if' block`,
      });
    }

    return { kind: 'if', condition, thenBranch, elseBranch, line: tok.line };
  }

  private parseRepeat(): StatementNode {
    const tok = this.advance(); // 'repeat'

    let node: StatementNode;
    if (this.matchWord('while')) {
      const condition = this.parseExpr();
      this.syncToNextLine();
      const body = this.parseBlock(
        (t, next) => t.kind === 'word' && t.lower === 'end' && next.kind === 'word' && next.lower === 'repeat',
      );
      node = { kind: 'repeatWhile', condition, body, line: tok.line };
    } else if (this.matchWord('with')) {
      const v = this.peek();
      const varName = v.kind === 'word' ? this.advance().lower : '_i';
      if (this.peek().kind === 'op' && this.peek().value === '=') {
        this.advance();
      } else {
        this.diagnostics.push({
          line: this.peek().line,
          column: this.peek().col,
          message: `Expected '=' in 'repeat with ${varName} = <start> to <end>'`,
        });
      }
      const start = this.parseExpr();
      this.expectWord('to');
      const end = this.parseExpr();
      this.syncToNextLine();
      const body = this.parseBlock(
        (t, next) => t.kind === 'word' && t.lower === 'end' && next.kind === 'word' && next.lower === 'repeat',
      );
      node = { kind: 'repeatWith', varName, start, end, body, line: tok.line };
    } else {
      this.matchWord('for');
      const count = this.parseExpr();
      this.matchWord('times');
      this.syncToNextLine();
      const body = this.parseBlock(
        (t, next) => t.kind === 'word' && t.lower === 'end' && next.kind === 'word' && next.lower === 'repeat',
      );
      node = { kind: 'repeatTimes', count, body, line: tok.line };
    }

    if (this.matchWord('end') && this.matchWord('repeat')) {
      this.syncToNextLine();
    } else {
      this.diagnostics.push({
        line: tok.line,
        column: tok.col,
        message: `Missing 'end repeat' for repeat loop`,
      });
    }

    return node;
  }

  private parseExit(): StatementNode {
    const tok = this.advance(); // 'exit'
    if (this.matchWord('repeat')) {
      this.syncToNextLine();
      return { kind: 'exitRepeat', line: tok.line };
    }
    const target = this.peek().kind === 'word' ? this.advance().lower : '';
    this.syncToNextLine();
    return { kind: 'exitHandler', handlerName: target, line: tok.line };
  }

  private parseReturn(): StatementNode {
    const tok = this.advance(); // 'return'
    let value: ExprNode | undefined;
    if (!this.atLineEnd()) {
      value = this.parseExpr();
    }
    this.syncToNextLine();
    return { kind: 'return', value, line: tok.line };
  }

  private parseCall(): StatementNode {
    const tok = this.advance();
    const args: ExprNode[] = [];
    while (!this.atLineEnd()) {
      args.push(this.parseExpr());
      if (this.peek().kind === 'comma') {
        this.advance();
      } else {
        break;
      }
    }
    this.syncToNextLine();
    return { kind: 'call', name: tok.lower, args, line: tok.line };
  }

  // --- Expressions (precedence climbing) ---

  private parseExpr(): ExprNode {
    return this.parseOr();
  }

  private parseOr(): ExprNode {
    let left = this.parseAnd();
    while (this.isWord('or')) {
      // Do not consume `or` when inside `answer "msg" with "A" or "B"`? Wait: answer parses each button with parseExpr,
      // Wait: if someone writes `answer "Hi" with "Yes" or "No"`, parseExpr would swallow `or` as boolean!
      // Let's handle that cleanly: if right side is only a string? No, simpler: in parseAnswer use parseConcat/parsePrimary, or keep `or` in boolean exprs.
      // Actually let's check: in parseOr we parse logical OR normally, and in parseAnswer we use parseConcat!
      this.advance();
      const right = this.parseAnd();
      left = { kind: 'binary', op: 'or', left, right };
    }
    return left;
  }

  private parseAnd(): ExprNode {
    let left = this.parseNot();
    while (this.isWord('and')) {
      this.advance();
      const right = this.parseNot();
      left = { kind: 'binary', op: 'and', left, right };
    }
    return left;
  }

  private parseNot(): ExprNode {
    if (this.matchWord('not')) {
      return { kind: 'unary', op: 'not', operand: this.parseNot() };
    }
    return this.parseComparison();
  }

  private parseComparison(): ExprNode {
    let left = this.parseConcat();
    while (true) {
      const tok = this.peek();
      if (tok.kind === 'op' && (tok.value === '=' || tok.value === '<>' || tok.value === '!=' || tok.value === '<' || tok.value === '<=' || tok.value === '>' || tok.value === '>=')) {
        this.advance();
        const op = tok.value === '!=' ? '<>' : (tok.value as '=' | '<>' | '<' | '<=' | '>' | '>=');
        left = { kind: 'binary', op, left, right: this.parseConcat() };
      } else if (this.isWord('is')) {
        this.advance();
        if (this.matchWord('not')) {
          left = { kind: 'binary', op: '<>', left, right: this.parseConcat() };
        } else {
          left = { kind: 'binary', op: '=', left, right: this.parseConcat() };
        }
      } else if (this.matchWord('contains')) {
        left = { kind: 'binary', op: 'contains', left, right: this.parseConcat() };
      } else {
        break;
      }
    }
    return left;
  }

  private parseConcat(): ExprNode {
    let left = this.parseAddSub();
    while (this.peek().kind === 'op' && (this.peek().value === '&' || this.peek().value === '&&')) {
      const op = this.advance().value as '&' | '&&';
      left = { kind: 'binary', op, left, right: this.parseAddSub() };
    }
    return left;
  }

  private parseAddSub(): ExprNode {
    let left = this.parseMulDiv();
    while (this.peek().kind === 'op' && (this.peek().value === '+' || this.peek().value === '-')) {
      const op = this.advance().value as '+' | '-';
      left = { kind: 'binary', op, left, right: this.parseMulDiv() };
    }
    return left;
  }

  private parseMulDiv(): ExprNode {
    let left = this.parseUnary();
    while (
      (this.peek().kind === 'op' && (this.peek().value === '*' || this.peek().value === '/')) ||
      this.isWord('mod')
    ) {
      const tok = this.advance();
      const op = (tok.kind === 'word' ? 'mod' : tok.value) as '*' | '/' | 'mod';
      left = { kind: 'binary', op, left, right: this.parseUnary() };
    }
    return left;
  }

  private parseUnary(): ExprNode {
    if (this.peek().kind === 'op' && this.peek().value === '-') {
      this.advance();
      return { kind: 'unary', op: '-', operand: this.parseUnary() };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): ExprNode {
    const tok = this.peek();

    if (tok.kind === 'number') {
      this.advance();
      return { kind: 'number', value: Number(tok.value) };
    }
    if (tok.kind === 'string') {
      this.advance();
      return { kind: 'string', value: tok.value };
    }
    if (tok.kind === 'lparen') {
      this.advance();
      const inner = this.parseExpr();
      if (this.peek().kind === 'rparen') {
        this.advance();
      } else {
        this.diagnostics.push({
          line: this.peek().line,
          column: this.peek().col,
          message: "Expected closing ')'",
        });
      }
      return inner;
    }

    // Built-in `the ...` properties
    if (this.isWord('the')) {
      const saved = this.pos;
      this.advance(); // 'the'
      if (this.isWord('number') && this.isWord('of', 1) && this.isWord('cards', 2)) {
        this.advance();
        this.advance();
        this.advance();
        return { kind: 'systemProp', prop: 'cardCount' };
      }
      if (this.isWord('name') && this.isWord('of', 1) && this.isWord('this', 2) && this.isWord('card', 3)) {
        this.advance();
        this.advance();
        this.advance();
        this.advance();
        return { kind: 'systemProp', prop: 'cardName' };
      }
      if (this.matchWord('text')) {
        this.expectWord('of');
        if (this.matchWord('field') || this.matchWord('fld')) {
          return { kind: 'fieldValue', nameExpr: this.parsePrimary() };
        }
      }
      if (this.matchWord('label')) {
        this.expectWord('of');
        if (this.matchWord('button') || this.matchWord('btn')) {
          return { kind: 'buttonProp', prop: 'label', nameExpr: this.parsePrimary() };
        }
      }
      if (this.matchWord('checked')) {
        this.expectWord('of');
        if (this.matchWord('button') || this.matchWord('btn')) {
          return { kind: 'buttonProp', prop: 'checked', nameExpr: this.parsePrimary() };
        }
      }
      this.pos = saved;
    }

    if (this.matchWord('field') || this.matchWord('fld')) {
      return { kind: 'fieldValue', nameExpr: this.parsePrimary() };
    }

    if (tok.kind === 'word') {
      this.advance();
      switch (tok.lower) {
        case 'empty':
          return { kind: 'string', value: '' };
        case 'space':
          return { kind: 'string', value: ' ' };
        case 'return':
          return { kind: 'string', value: '\n' };
        case 'quote':
          return { kind: 'string', value: '"' };
        case 'true':
          return { kind: 'boolean', value: true };
        case 'false':
          return { kind: 'boolean', value: false };
        default:
          return { kind: 'variable', name: tok.lower };
      }
    }

    this.diagnostics.push({
      line: tok.line,
      column: tok.col,
      message: `Expected expression, found '${tok.value || tok.kind}'`,
    });
    return { kind: 'string', value: '' };
  }
}

export function parseScript(source: string): ParseResult {
  const { tokens, diagnostics } = tokenize(source);
  const parser = new Parser(tokens, diagnostics);
  const program = parser.parseProgram(false);
  return { program, diagnostics: parser.diagnostics };
}

export function parseSingleCommand(source: string): ParseResult {
  const { tokens, diagnostics } = tokenize(source);
  const parser = new Parser(tokens, diagnostics);
  const program = parser.parseProgram(true);
  return { program, diagnostics: parser.diagnostics };
}
