import { parseScript, parseSingleCommand } from './parser';
import type {
  ContainerTarget,
  ExprNode,
  HandlerNode,
  RuntimeHost,
  StatementNode,
  TraceEntry,
  VisualEffect,
} from './types';

export const MAX_SANDBOX_STEPS = 10_000;
export const MAX_CALL_DEPTH = 32;
export const MAX_WAIT_MS = 5_000;

export class SandboxLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SandboxLimitError';
  }
}

export class HyperTalkRuntimeError extends Error {
  public readonly line: number;
  public readonly handler: string;

  constructor(message: string, line: number, handler: string) {
    super(`Line ${line} (${handler}): ${message}`);
    this.name = 'HyperTalkRuntimeError';
    this.line = line;
    this.handler = handler;
  }
}

type HTValue = string | number | boolean;

type ControlSignal =
  | { kind: 'none' }
  | { kind: 'exitRepeat' }
  | { kind: 'exitHandler'; name: string }
  | { kind: 'return'; value: HTValue };

export interface RunOptions {
  maxSteps?: number;
  fastWait?: boolean;
}

export interface RunResult {
  globals: Record<string, string>;
  it: string;
  trace: TraceEntry[];
  stepsExecuted: number;
}

function toStringVal(v: HTValue): string {
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return String(v);
}

function toNumberVal(v: HTValue): number {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v === 'boolean') return v ? 1 : 0;
  const trimmed = v.trim();
  if (trimmed === '') return 0;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toBoolVal(v: HTValue): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  const lower = v.trim().toLowerCase();
  return lower === 'true' || (lower !== '' && lower !== 'false' && lower !== '0');
}

function isNumericLike(v: HTValue): boolean {
  if (typeof v === 'number') return true;
  if (typeof v === 'boolean') return false;
  const t = v.trim();
  return t !== '' && !Number.isNaN(Number(t));
}

export class HyperTalkInterpreter {
  private readonly host: RuntimeHost;
  private readonly globals: Map<string, HTValue>;
  private pendingEffect: VisualEffect = 'none';
  private steps = 0;
  private maxSteps: number;
  private callDepth = 0;
  private fastWait: boolean;
  private trace: TraceEntry[] = [];
  private lastIt: HTValue = '';

  constructor(
    host: RuntimeHost,
    initialGlobals: Record<string, string> = {},
    options: RunOptions = {},
  ) {
    this.host = host;
    this.globals = new Map<string, HTValue>();
    for (const [k, v] of Object.entries(initialGlobals)) {
      this.globals.set(k.toLowerCase(), v);
    }
    this.maxSteps = options.maxSteps ?? MAX_SANDBOX_STEPS;
    this.fastWait = options.fastWait ?? false;
  }

  public getGlobalsRecord(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [k, v] of this.globals.entries()) {
      out[k] = toStringVal(v);
    }
    return out;
  }

  public async runHandler(
    scriptSources: string[],
    handlerName: string,
    args: HTValue[] = [],
  ): Promise<RunResult> {
    const handlerMap = new Map<string, HandlerNode>();
    // Later sources (e.g., stack script) act as fallbacks; earlier sources (object script) win
    for (let i = scriptSources.length - 1; i >= 0; i--) {
      const src = scriptSources[i];
      if (!src.trim()) continue;
      const { program, diagnostics } = parseScript(src);
      if (diagnostics.length > 0) {
        const d = diagnostics[0];
        throw new HyperTalkRuntimeError(d.message, d.line, handlerName);
      }
      for (const h of program.handlers) {
        handlerMap.set(h.name, h);
      }
    }

    const target = handlerMap.get(handlerName.toLowerCase());
    if (!target) {
      return {
        globals: this.getGlobalsRecord(),
        it: toStringVal(this.lastIt),
        trace: this.trace,
        stepsExecuted: this.steps,
      };
    }

    await this.execHandler(target, args, handlerMap);
    return {
      globals: this.getGlobalsRecord(),
      it: toStringVal(this.lastIt),
      trace: this.trace,
      stepsExecuted: this.steps,
    };
  }

  public async runMessageBox(commandSource: string, extraScripts: string[] = []): Promise<RunResult> {
    const { program, diagnostics } = parseSingleCommand(commandSource);
    if (diagnostics.length > 0) {
      const d = diagnostics[0];
      throw new HyperTalkRuntimeError(d.message, d.line, 'messageBox');
    }

    const handlerMap = new Map<string, HandlerNode>();
    for (const src of extraScripts) {
      if (!src.trim()) continue;
      const parsed = parseScript(src);
      if (parsed.diagnostics.length === 0) {
        for (const h of parsed.program.handlers) {
          handlerMap.set(h.name, h);
        }
      }
    }

    const locals = new Map<string, HTValue>();
    const declaredGlobals = new Set<string>(this.globals.keys());
    await this.execStatements(program.topLevelStatements, locals, declaredGlobals, handlerMap, 'messageBox');

    return {
      globals: this.getGlobalsRecord(),
      it: toStringVal(this.lastIt),
      trace: this.trace,
      stepsExecuted: this.steps,
    };
  }

  private async execHandler(
    handler: HandlerNode,
    args: HTValue[],
    handlerMap: Map<string, HandlerNode>,
  ): Promise<HTValue> {
    if (this.callDepth >= MAX_CALL_DEPTH) {
      throw new SandboxLimitError(`Maximum call depth (${MAX_CALL_DEPTH}) exceeded in handler '${handler.name}'`);
    }
    this.callDepth++;
    const locals = new Map<string, HTValue>();
    const declaredGlobals = new Set<string>();
    handler.params.forEach((p, idx) => {
      locals.set(p, args[idx] ?? '');
    });

    try {
      const sig = await this.execStatements(handler.body, locals, declaredGlobals, handlerMap, handler.name);
      if (sig.kind === 'return') return sig.value;
      return '';
    } finally {
      this.callDepth--;
    }
  }

  private async execStatements(
    stmts: StatementNode[],
    locals: Map<string, HTValue>,
    declaredGlobals: Set<string>,
    handlerMap: Map<string, HandlerNode>,
    activeHandler: string,
  ): Promise<ControlSignal> {
    for (const stmt of stmts) {
      this.steps++;
      if (this.steps > this.maxSteps) {
        throw new SandboxLimitError(
          `Execution limit reached (${this.maxSteps} AST steps). Possible infinite loop prevented.`,
        );
      }

      const summary = this.summarizeStatement(stmt);
      const snapshot = this.getGlobalsRecord();
      if (this.host.onBeforeStep) {
        await this.host.onBeforeStep(stmt.line, summary, snapshot);
      }

      const entry: TraceEntry = {
        step: this.steps,
        line: stmt.line,
        handler: activeHandler,
        summary,
        globalsSnapshot: snapshot,
      };
      this.trace.push(entry);
      this.host.onTrace?.(entry);

      const sig = await this.execStatement(stmt, locals, declaredGlobals, handlerMap, activeHandler);
      if (sig.kind !== 'none') return sig;
    }
    return { kind: 'none' };
  }

  private async execStatement(
    stmt: StatementNode,
    locals: Map<string, HTValue>,
    declaredGlobals: Set<string>,
    handlerMap: Map<string, HandlerNode>,
    activeHandler: string,
  ): Promise<ControlSignal> {
    switch (stmt.kind) {
      case 'global':
        for (const name of stmt.names) {
          declaredGlobals.add(name);
          if (!this.globals.has(name)) {
            this.globals.set(name, '');
          }
        }
        return { kind: 'none' };

      case 'put': {
        const val = this.evalExpr(stmt.value, locals, declaredGlobals);
        const strVal = toStringVal(val);
        const existing = toStringVal(this.readContainer(stmt.target, locals, declaredGlobals));
        let next: HTValue = val;
        if (stmt.mode === 'before') next = strVal + existing;
        else if (stmt.mode === 'after') next = existing + strVal;
        this.writeContainer(stmt.target, next, locals, declaredGlobals);
        return { kind: 'none' };
      }

      case 'math': {
        const cur = toNumberVal(this.readContainer(stmt.target, locals, declaredGlobals));
        const operand = toNumberVal(this.evalExpr(stmt.value, locals, declaredGlobals));
        let next = cur;
        if (stmt.op === 'add') next = cur + operand;
        else if (stmt.op === 'subtract') next = cur - operand;
        else if (stmt.op === 'multiply') next = cur * operand;
        else if (stmt.op === 'divide') {
          if (operand === 0) {
            throw new HyperTalkRuntimeError('Division by zero', stmt.line, activeHandler);
          }
          next = cur / operand;
        }
        this.writeContainer(stmt.target, next, locals, declaredGlobals);
        return { kind: 'none' };
      }

      case 'visualEffect':
        this.pendingEffect = stmt.effect;
        return { kind: 'none' };

      case 'goCard': {
        const count = this.host.getCardCount();
        if (count === 0) return { kind: 'none' };
        const current = this.host.getCurrentCardIndex();
        let nextIdx = current;

        if (stmt.target.mode === 'relative') {
          if (stmt.target.dir === 'next') nextIdx = (current + 1) % count;
          else if (stmt.target.dir === 'prev') nextIdx = (current - 1 + count) % count;
          else if (stmt.target.dir === 'first') nextIdx = 0;
          else if (stmt.target.dir === 'last') nextIdx = count - 1;
        } else {
          const val = this.evalExpr(stmt.target.expr, locals, declaredGlobals);
          if (typeof val === 'number' || (typeof val === 'string' && /^\d+$/.test(val.trim()))) {
            const oneBased = Math.floor(Number(val));
            if (oneBased < 1 || oneBased > count) {
              throw new HyperTalkRuntimeError(`Card ${oneBased} is out of range (1..${count})`, stmt.line, activeHandler);
            }
            nextIdx = oneBased - 1;
          } else {
            const found = this.host.findCardIndexByName(toStringVal(val));
            if (found < 0) {
              throw new HyperTalkRuntimeError(`Card "${toStringVal(val)}" not found`, stmt.line, activeHandler);
            }
            nextIdx = found;
          }
        }

        const effect = this.pendingEffect;
        this.pendingEffect = 'none';
        await this.host.goToCard(nextIdx, effect);
        return { kind: 'none' };
      }

      case 'visibility': {
        const name = toStringVal(this.evalExpr(stmt.nameExpr, locals, declaredGlobals));
        this.host.setObjectVisible(stmt.objectKind, name, stmt.visible);
        return { kind: 'none' };
      }

      case 'setProp': {
        const name = toStringVal(this.evalExpr(stmt.nameExpr, locals, declaredGlobals));
        const value = this.evalExpr(stmt.value, locals, declaredGlobals);
        if (stmt.objectKind === 'button' && stmt.prop === 'label') {
          this.host.setButtonLabel(name, toStringVal(value));
        } else if (stmt.objectKind === 'button' && stmt.prop === 'checked') {
          this.host.setButtonChecked(name, toBoolVal(value));
        } else if (stmt.objectKind === 'field' && stmt.prop === 'text') {
          this.host.setFieldText(name, toStringVal(value));
        }
        return { kind: 'none' };
      }

      case 'answer': {
        const prompt = toStringVal(this.evalExpr(stmt.prompt, locals, declaredGlobals));
        const buttons =
          stmt.buttons.length > 0
            ? stmt.buttons.map((b) => toStringVal(this.evalExpr(b, locals, declaredGlobals)))
            : ['OK'];
        const chosen = await this.host.answer(prompt, buttons);
        locals.set('it', chosen);
        this.lastIt = chosen;
        return { kind: 'none' };
      }

      case 'ask': {
        const prompt = toStringVal(this.evalExpr(stmt.prompt, locals, declaredGlobals));
        const defVal = stmt.defaultValue ? toStringVal(this.evalExpr(stmt.defaultValue, locals, declaredGlobals)) : '';
        const response = await this.host.ask(prompt, defVal);
        const result = response ?? '';
        locals.set('it', result);
        this.lastIt = result;
        return { kind: 'none' };
      }

      case 'play': {
        const sound = toStringVal(this.evalExpr(stmt.sound, locals, declaredGlobals));
        this.host.play(sound);
        return { kind: 'none' };
      }

      case 'wait': {
        const amount = Math.max(0, toNumberVal(this.evalExpr(stmt.amount, locals, declaredGlobals)));
        const ms = Math.min(MAX_WAIT_MS, stmt.unit === 's' ? amount * 1000 : amount);
        if (!this.fastWait && ms > 0) {
          await this.host.wait(ms);
        }
        return { kind: 'none' };
      }

      case 'if': {
        const cond = toBoolVal(this.evalExpr(stmt.condition, locals, declaredGlobals));
        const branch = cond ? stmt.thenBranch : stmt.elseBranch;
        return this.execStatements(branch, locals, declaredGlobals, handlerMap, activeHandler);
      }

      case 'repeatTimes': {
        const count = Math.max(0, Math.floor(toNumberVal(this.evalExpr(stmt.count, locals, declaredGlobals))));
        for (let i = 0; i < count; i++) {
          const sig = await this.execStatements(stmt.body, locals, declaredGlobals, handlerMap, activeHandler);
          if (sig.kind === 'exitRepeat') break;
          if (sig.kind !== 'none') return sig;
        }
        return { kind: 'none' };
      }

      case 'repeatWith': {
        const start = Math.floor(toNumberVal(this.evalExpr(stmt.start, locals, declaredGlobals)));
        const end = Math.floor(toNumberVal(this.evalExpr(stmt.end, locals, declaredGlobals)));
        const step = start <= end ? 1 : -1;
        for (let v = start; step > 0 ? v <= end : v >= end; v += step) {
          this.writeVar(stmt.varName, v, locals, declaredGlobals);
          const sig = await this.execStatements(stmt.body, locals, declaredGlobals, handlerMap, activeHandler);
          if (sig.kind === 'exitRepeat') break;
          if (sig.kind !== 'none') return sig;
        }
        return { kind: 'none' };
      }

      case 'repeatWhile': {
        while (toBoolVal(this.evalExpr(stmt.condition, locals, declaredGlobals))) {
          const sig = await this.execStatements(stmt.body, locals, declaredGlobals, handlerMap, activeHandler);
          if (sig.kind === 'exitRepeat') break;
          if (sig.kind !== 'none') return sig;
          // Ensure empty while loops still trip sandbox step budget
          this.steps++;
          if (this.steps > this.maxSteps) {
            throw new SandboxLimitError(
              `Execution limit reached (${this.maxSteps} AST steps). Possible infinite loop prevented.`,
            );
          }
        }
        return { kind: 'none' };
      }

      case 'exitRepeat':
        return { kind: 'exitRepeat' };

      case 'exitHandler':
        return { kind: 'exitHandler', name: stmt.handlerName };

      case 'return': {
        const value = stmt.value ? this.evalExpr(stmt.value, locals, declaredGlobals) : '';
        return { kind: 'return', value };
      }

      case 'call': {
        const target = handlerMap.get(stmt.name);
        if (!target) {
          throw new HyperTalkRuntimeError(`Unknown command or handler '${stmt.name}'`, stmt.line, activeHandler);
        }
        const evaluatedArgs = stmt.args.map((a) => this.evalExpr(a, locals, declaredGlobals));
        const ret = await this.execHandler(target, evaluatedArgs, handlerMap);
        locals.set('it', ret);
        this.lastIt = ret;
        return { kind: 'none' };
      }
    }
  }

  private readVar(name: string, locals: Map<string, HTValue>, declaredGlobals: Set<string>): HTValue {
    if (name === 'it') {
      return locals.has('it') ? locals.get('it')! : this.lastIt;
    }
    if (declaredGlobals.has(name)) {
      return this.globals.get(name) ?? '';
    }
    if (locals.has(name)) {
      return locals.get(name)!;
    }
    return '';
  }

  private writeVar(name: string, value: HTValue, locals: Map<string, HTValue>, declaredGlobals: Set<string>): void {
    if (name === 'it') {
      locals.set('it', value);
      this.lastIt = value;
      return;
    }
    if (declaredGlobals.has(name)) {
      this.globals.set(name, value);
    } else {
      locals.set(name, value);
    }
  }

  private readContainer(
    target: ContainerTarget,
    locals: Map<string, HTValue>,
    declaredGlobals: Set<string>,
  ): HTValue {
    if (target.kind === 'variable') {
      return this.readVar(target.name, locals, declaredGlobals);
    }
    const fieldName = toStringVal(this.evalExpr(target.nameExpr, locals, declaredGlobals));
    return this.host.getFieldText(fieldName);
  }

  private writeContainer(
    target: ContainerTarget,
    value: HTValue,
    locals: Map<string, HTValue>,
    declaredGlobals: Set<string>,
  ): void {
    if (target.kind === 'variable') {
      this.writeVar(target.name, value, locals, declaredGlobals);
    } else {
      const fieldName = toStringVal(this.evalExpr(target.nameExpr, locals, declaredGlobals));
      this.host.setFieldText(fieldName, toStringVal(value));
    }
  }

  private evalExpr(expr: ExprNode, locals: Map<string, HTValue>, declaredGlobals: Set<string>): HTValue {
    switch (expr.kind) {
      case 'number':
        return expr.value;
      case 'string':
        return expr.value;
      case 'boolean':
        return expr.value;
      case 'variable':
        return this.readVar(expr.name, locals, declaredGlobals);
      case 'fieldValue': {
        const name = toStringVal(this.evalExpr(expr.nameExpr, locals, declaredGlobals));
        return this.host.getFieldText(name);
      }
      case 'buttonProp': {
        const name = toStringVal(this.evalExpr(expr.nameExpr, locals, declaredGlobals));
        return expr.prop === 'label' ? this.host.getButtonLabel(name) : this.host.getButtonChecked(name);
      }
      case 'systemProp':
        return expr.prop === 'cardCount' ? this.host.getCardCount() : this.host.getCurrentCardName();
      case 'unary': {
        const v = this.evalExpr(expr.operand, locals, declaredGlobals);
        return expr.op === '-' ? -toNumberVal(v) : !toBoolVal(v);
      }
      case 'binary': {
        if (expr.op === 'and') {
          return (
            toBoolVal(this.evalExpr(expr.left, locals, declaredGlobals)) &&
            toBoolVal(this.evalExpr(expr.right, locals, declaredGlobals))
          );
        }
        if (expr.op === 'or') {
          return (
            toBoolVal(this.evalExpr(expr.left, locals, declaredGlobals)) ||
            toBoolVal(this.evalExpr(expr.right, locals, declaredGlobals))
          );
        }

        const l = this.evalExpr(expr.left, locals, declaredGlobals);
        const r = this.evalExpr(expr.right, locals, declaredGlobals);

        switch (expr.op) {
          case '+':
            return toNumberVal(l) + toNumberVal(r);
          case '-':
            return toNumberVal(l) - toNumberVal(r);
          case '*':
            return toNumberVal(l) * toNumberVal(r);
          case '/':
            return toNumberVal(r) === 0 ? 0 : toNumberVal(l) / toNumberVal(r);
          case 'mod':
            return toNumberVal(r) === 0 ? 0 : toNumberVal(l) % toNumberVal(r);
          case '&':
            return toStringVal(l) + toStringVal(r);
          case '&&':
            return `${toStringVal(l)} ${toStringVal(r)}`;
          case '=':
            if (isNumericLike(l) && isNumericLike(r)) return toNumberVal(l) === toNumberVal(r);
            return toStringVal(l).toLowerCase() === toStringVal(r).toLowerCase();
          case '<>':
            if (isNumericLike(l) && isNumericLike(r)) return toNumberVal(l) !== toNumberVal(r);
            return toStringVal(l).toLowerCase() !== toStringVal(r).toLowerCase();
          case '<':
            return toNumberVal(l) < toNumberVal(r);
          case '<=':
            return toNumberVal(l) <= toNumberVal(r);
          case '>':
            return toNumberVal(l) > toNumberVal(r);
          case '>=':
            return toNumberVal(l) >= toNumberVal(r);
          case 'contains':
            return toStringVal(l).toLowerCase().includes(toStringVal(r).toLowerCase());
        }
      }
    }
  }

  private summarizeStatement(stmt: StatementNode): string {
    switch (stmt.kind) {
      case 'global':
        return `global ${stmt.names.join(', ')}`;
      case 'put':
        return `put ... ${stmt.mode} ${stmt.target.kind === 'variable' ? stmt.target.name : 'field'}`;
      case 'math':
        return `${stmt.op} ...`;
      case 'visualEffect':
        return `visual effect ${stmt.effect}`;
      case 'goCard':
        return stmt.target.mode === 'relative' ? `go to ${stmt.target.dir} card` : `go to card ...`;
      case 'visibility':
        return `${stmt.visible ? 'show' : 'hide'} ${stmt.objectKind}`;
      case 'setProp':
        return `set the ${stmt.prop} of ${stmt.objectKind}`;
      case 'answer':
        return 'answer ...';
      case 'ask':
        return 'ask ...';
      case 'play':
        return 'play ...';
      case 'wait':
        return 'wait ...';
      case 'if':
        return 'if ... then';
      case 'repeatTimes':
      case 'repeatWith':
      case 'repeatWhile':
        return 'repeat ...';
      case 'exitRepeat':
        return 'exit repeat';
      case 'exitHandler':
        return `exit ${stmt.handlerName}`;
      case 'return':
        return 'return';
      case 'call':
        return `call ${stmt.name}`;
    }
  }
}
