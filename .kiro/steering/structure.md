---
inclusion: always
---

# HyperCrypt — Repository Structure & Conventions (v2.0)

## Directory Layout
- `src/engine/` — Pure zero-DOM TypeScript language engine (`lexer.ts`, `parser.ts`, `interpreter.ts`, `headlessHost.ts`), AST graph analyzer (`stackGraph.ts`), syntax highlighter (`syntaxHighlight.ts`), 1-bit bitmap & Atkinson dithering (`bitmap.ts`, `atkinson.ts`), Markdown-to-Stack compiler (`markdownCompiler.ts`), static stack validator (`validator.ts`), URL hash codec (`urlShare.ts`), and single-file HTML exporter (`htmlExporter.ts`).
- `src/player/` — Browser-specific standalone offline runtime (`standalonePlayer.ts`) compiled by `esbuild` into `src/player/generated/standalonePlayer.bundle.txt`.
- `src/presets/` — Four EN+ZH flagship stacks (`atticMac1987.ts`, `starlightRpg.ts`, `prodRunbook502.ts`, `atkinsonLab.ts`) and deterministic 1-bit Atkinson pixel artwork builders (`artGenerators.ts`).
- `src/studio/` — React 19 four-view workstation (`Browse`, `Author`, `Map`, `MD → Stack`), EN/ZH i18n (`i18n/messages.ts`), undoable state store (`store/useStudioStore.tsx`), Web Audio retro synth (`audio/retroAudio.ts`), and dual-skin CSS themes (`styles/themes.css`).
- `mcp/` — `hypercrypt-mcp` stdio server (`mcp/server.ts`, pre-bundled to zero-install `dist-mcp/server.js`) exposing `validate_hypertalk`, `run_hypertalk_script`, `validate_stack`, and `compile_markdown_to_stack`.
- `tests/` — Organized strictly into `tests/unit/`, `tests/integration/`, and `tests/e2e/`.
- `.kiro/` — Source of truth for steering, EARS specs, v1 automation hooks, and MCP settings.

## Naming & Code Style
- Strict TypeScript (`noUnusedLocals`, `noUnusedParameters`, no `any` in `src/engine/`).
- Deterministic IDs for built-in presets so Playwright E2E selectors and stack validations remain stable.
- Keep components modular with clear separation between pure engine logic, canvas rendering, state actions, and script execution.
- Default user-facing locale is crisp, friendly English (`en`) with 1-click Simplified Chinese (`zh`) toggle.
