# Design — `stack-studio`

## State Management (`src/studio/store/useStudioStore.ts`)
- Holds:
  - `stack: Stack`, `activeCardIndex: number`
  - `mode: 'browse' | 'author'`, `theme: 'classic' | 'kiroween'`, `muted: boolean`
  - `activeTool: 'select' | 'button' | 'field' | 'hotspot' | 'pencil' | 'line' | 'rect' | 'bucket' | 'eraser'`
  - `activePattern: 'solid' | 'stipple50' | 'diagonal' | 'checker'`
  - `selectedObjectId: string | null`, `inspectorTab: 'script' | 'debug' | 'props'`
  - `globals: Record<string, string>`, `lastIt: string`, `trace: TraceEntry[]`
  - `stepMode: boolean`, `pausedLine: number | null`, `pendingStepResolve: (() => void) | null`
  - `activeModal: AnswerModalState | AskModalState | null`
  - `activeTransition: VisualEffect`, `messageBoxOpen: boolean`
  - `undoStack: Stack[]`, `redoStack: Stack[]` (bounded to 30 snapshots)
- Auto-saves working stack edits to `localStorage` (`hypercrypt:autosave:v1`), cleanly overridden if a `#stack=` share hash is present on load.

## 512×342 Crisp Coordinate Mapping
- Logical card frame is fixed at `512 × 342` CSS coordinate space, wrapped in a responsive stage container using ResizeObserver + CSS scale so pointer events map cleanly via `(clientX - rect.left) * (512 / rect.width)`.
- Bitmap layer renders via `<canvas width={512} height={342} style={{ imageRendering: 'pixelated' }} />`, re-painted whenever `bitmapRle` or `theme` changes.

## Built-in Presets (`src/presets/`)
- Deterministic procedural 1-bit artwork generators (using `atkinsonDither` directly!) produce crisp, charming illustrations for every card of *The Attic Mac of 1987* and *Atkinson Darkroom & Script Lab* without bloating the bundle with large PNG files.
- *Prod 502 Triage Runbook* is generated directly through `compileMarkdownToStack(RUNBOOK_MD)` so the app itself eats its own MCP compiler dogfood!
