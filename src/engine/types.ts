export const CARD_WIDTH = 512;
export const CARD_HEIGHT = 342;

export type ThemeId = 'classic' | 'kiroween';

export type VisualEffect =
  | 'none'
  | 'dissolve'
  | 'wipe left'
  | 'wipe right'
  | 'iris open'
  | 'barn door open';

export type ButtonStyle = 'roundrect' | 'shadow' | 'transparent' | 'checkbox';
export type FieldStyle = 'rectangle' | 'scrolling' | 'transparent';

export interface CardObjectBase {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  script: string;
}

export interface ButtonObject extends CardObjectBase {
  type: 'button';
  style: ButtonStyle;
  label: string;
  accent?: boolean;
  checked?: boolean;
}

export interface FieldObject extends CardObjectBase {
  type: 'field';
  style: FieldStyle;
  text: string;
  locked: boolean;
  fontSize?: number;
}

export type CardObject = ButtonObject | FieldObject;

export interface Card {
  id: string;
  name: string;
  script: string;
  bitmapRle: string;
  objects: CardObject[];
}

export interface Stack {
  schemaVersion: 1;
  id: string;
  title: string;
  author: string;
  description: string;
  defaultTheme?: ThemeId;
  script: string;
  cards: Card[];
}

export interface ParseDiagnostic {
  line: number;
  column: number;
  message: string;
}

export interface TraceEntry {
  step: number;
  line: number;
  handler: string;
  summary: string;
  globalsSnapshot: Record<string, string>;
}

export interface RuntimeHost {
  getCurrentCardIndex(): number;
  getCardCount(): number;
  getCurrentCardName(): string;
  findCardIndexByName(name: string): number;
  goToCard(index: number, effect: VisualEffect): Promise<void> | void;
  getFieldText(name: string): string;
  setFieldText(name: string, text: string): void;
  getButtonLabel(name: string): string;
  setButtonLabel(name: string, label: string): void;
  getButtonChecked(name: string): boolean;
  setButtonChecked(name: string, checked: boolean): void;
  setObjectVisible(kind: 'button' | 'field', name: string, visible: boolean): void;
  answer(prompt: string, buttons: string[]): Promise<string>;
  ask(prompt: string, defaultValue: string): Promise<string | null>;
  play(sound: string): void;
  wait(ms: number): Promise<void>;
  onTrace?: (entry: TraceEntry) => void;
  /** Observer snapshots are copies; keep host session globals shared. */
  onBeforeStep?: (line: number, summary: string, globals: Record<string, string>) => Promise<void>;
}

// --- HyperTalk AST Types ---

export interface ProgramNode {
  handlers: HandlerNode[];
  topLevelStatements: StatementNode[];
}

export interface HandlerNode {
  name: string;
  params: string[];
  body: StatementNode[];
  line: number;
}

export type ContainerTarget =
  | { kind: 'variable'; name: string }
  | { kind: 'field'; nameExpr: ExprNode };

export type PutMode = 'into' | 'before' | 'after';

export type StatementNode =
  | { kind: 'global'; names: string[]; line: number }
  | { kind: 'put'; value: ExprNode; mode: PutMode; target: ContainerTarget; line: number }
  | { kind: 'math'; op: 'add' | 'subtract' | 'multiply' | 'divide'; value: ExprNode; target: ContainerTarget; line: number }
  | { kind: 'visualEffect'; effect: VisualEffect; line: number }
  | { kind: 'goCard'; target: { mode: 'relative'; dir: 'next' | 'prev' | 'first' | 'last' } | { mode: 'expr'; expr: ExprNode }; line: number }
  | { kind: 'visibility'; visible: boolean; objectKind: 'button' | 'field'; nameExpr: ExprNode; line: number }
  | { kind: 'setProp'; prop: 'label' | 'text' | 'checked'; objectKind: 'button' | 'field'; nameExpr: ExprNode; value: ExprNode; line: number }
  | { kind: 'answer'; prompt: ExprNode; buttons: ExprNode[]; line: number }
  | { kind: 'ask'; prompt: ExprNode; defaultValue?: ExprNode; line: number }
  | { kind: 'play'; sound: ExprNode; line: number }
  | { kind: 'wait'; amount: ExprNode; unit: 'ms' | 's'; line: number }
  | { kind: 'if'; condition: ExprNode; thenBranch: StatementNode[]; elseBranch: StatementNode[]; line: number }
  | { kind: 'repeatTimes'; count: ExprNode; body: StatementNode[]; line: number }
  | { kind: 'repeatWith'; varName: string; start: ExprNode; end: ExprNode; body: StatementNode[]; line: number }
  | { kind: 'repeatWhile'; condition: ExprNode; body: StatementNode[]; line: number }
  | { kind: 'exitRepeat'; line: number }
  | { kind: 'exitHandler'; handlerName: string; line: number }
  | { kind: 'return'; value?: ExprNode; line: number }
  | { kind: 'call'; name: string; args: ExprNode[]; line: number };

export type ExprNode =
  | { kind: 'number'; value: number }
  | { kind: 'string'; value: string }
  | { kind: 'boolean'; value: boolean }
  | { kind: 'variable'; name: string }
  | { kind: 'fieldValue'; nameExpr: ExprNode }
  | { kind: 'buttonProp'; prop: 'label' | 'checked'; nameExpr: ExprNode }
  | { kind: 'systemProp'; prop: 'cardCount' | 'cardName' }
  | { kind: 'random'; maxExpr: ExprNode }
  | { kind: 'unary'; op: '-' | 'not'; operand: ExprNode }
  | {
      kind: 'binary';
      op:
        | '+'
        | '-'
        | '*'
        | '/'
        | 'mod'
        | '&'
        | '&&'
        | '='
        | '<>'
        | '<'
        | '<='
        | '>'
        | '>='
        | 'contains'
        | 'and'
        | 'or';
      left: ExprNode;
      right: ExprNode;
    };

export interface ValidationIssue {
  severity: 'error' | 'warning';
  location: string;
  message: string;
  line?: number;
}
