---
inclusion: always
---

# HyperCrypt — Repository Structure & Conventions

## Directory Layout
- `src/engine/` — Pure TypeScript language engine, 1-bit bitmap & Atkinson dithering, Markdown-to-Stack compiler, static stack validator, URL hash codec, and single-file HTML exporter.
- `src/presets/` — Built-in flagship stacks (`atticMac1987.ts`, `prodRunbook502.ts`, `atkinsonLab.ts`) and deterministic 1-bit pixel artwork builders.
- `src/studio/` — React workstation components, Zustand/Context state store with undo/redo, Web Audio retro synth, and dual-skin CSS themes.
- `mcp/` — `hypercrypt-mcp` stdio server exposing `validate_hypertalk`, `run_hypertalk_script`, `validate_stack`, and `compile_markdown_to_stack`.
- `tests/` — Organized strictly into `tests/unit/`, `tests/integration/`, and `tests/e2e/`.
- `.kiro/` — Source of truth for steering, EARS specs, automation hooks, and MCP settings.

## Naming & Code Style
- Strict TypeScript (`noUnusedLocals`, `noUnusedParameters`, no `any` in `src/engine/`).
- Deterministic IDs for built-in presets so Playwright E2E selectors and stack validations remain stable.
- Keep components modular (< 250 lines per file where practical) with clear separation between canvas rendering, state actions, and script execution.
- All user-visible copy in the app is crisp, friendly English (matching international Devpost judges).
