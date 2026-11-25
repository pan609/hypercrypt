# Design — `hypertalk-engine`

## Module Structure (`src/engine/`)
- `types.ts`: `Stack`, `Card`, `CardObject`, `VisualEffect`, `ParseDiagnostic`, `TraceEntry`, `RuntimeHost`.
- `lexer.ts`: Single-pass scanner emitting `Token { kind, value, lower, line, col }`. Handles case-insensitive keywords, `--` comments, multi-word operator lookahead support, and string escapes.
- `parser.ts`: Recursive-descent parser returning `{ program, diagnostics }`. Supports both full scripts (`parseScript`) and single-line Message Box commands (`parseSingleCommand`).
- `interpreter.ts`: `HyperTalkInterpreter` class accepting a `RuntimeHost` interface:
  ```ts
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
    onBeforeStep?: (line: number, summary: string, globals: Record<string, string>) => Promise<void>;
  }
  ```
- `validator.ts`: Walks `Stack` and parsed ASTs to collect `ValidationIssue[]` (`severity: 'error' | 'warning'`, `location`, `message`).
- `bitmap.ts`: Compact RLE format (`"W120B4W8..."` or hex-length encoded runs) + Bresenham line, rectangle, and iterative stack-based flood fill (no recursion stack overflow).
- `atkinson.ts`: Pure math luminance (`0.299R + 0.587G + 0.114B`) + brightness/contrast curve + Bill Atkinson 6-neighbor error diffusion (and optional `threshold` comparison mode).
