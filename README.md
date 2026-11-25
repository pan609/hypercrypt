# HyperCrypt — 1987 Apple HyperCard & HyperTalk Resurrected

> Built from scratch for **Kiroween 2026** (AWS Kiro Hackathon · **Best Resurrection** + **Overall**)  
> **Live Demo**: *(Deploy via Vercel — zero backend, zero login, instant launch)*  
> **License**: MIT

**HyperCrypt** resurrects **1987 Apple HyperCard & HyperTalk** for the modern web—bridging the gap between static Markdown and bloated cloud-dependent web apps. Build tactile **512×342 1-bit interactive card stacks** in your browser, write real plain-English **HyperTalk** scripts with a live step debugger, convert any photo with **Bill Atkinson 1-bit dithering**, export any stack into **one immortal offline `.html` file**, and compile Markdown runbooks into playable stacks directly from **Kiro IDE** via `hypercrypt-mcp`.

---

## Key Features

1. **Authentic Sandboxed HyperTalk Engine (`src/engine/`)**
   - Hand-written Lexer, Recursive-Descent AST Parser, and Async Sandboxed Interpreter (zero `eval()`, zero `new Function()`).
   - Supports `on mouseUp / openCard / closeCard`, `global`, `put ... into/before/after`, `add/subtract/multiply/divide`, `if/else if/else`, `repeat times/with/while`, `visual effect`, `go to card`, `show/hide`, `set the label/text/checked`, `ask`/`answer` modals, `play`, `wait`, and custom handlers.
   - Enforces a strict **10,000 AST step budget** and **32-frame call depth limit** for infinite-loop immunity.
   - Includes a live **Step Mode Debugger**, execution trace, variable watch panel, and classic **`Cmd/Ctrl+M` Message Box**.

2. **Tactile 512×342 1-Bit Studio & Dual Skins (`src/studio/`)**
   - **Browse Mode** (instant zero-friction landing) ↔ **Author Mode** (`Cmd/Ctrl+B` — drag/resize objects, 1-bit Pencil/Line/Rect/Bucket/Eraser, classic Mac patterns, Undo/Redo, Card Filmstrip).
   - **True Bill Atkinson 1-Bit Error-Diffusion Dithering**: upload/drop any PNG/JPG (or test built-in scenes) with live Brightness/Contrast sliders and Atkinson vs. Threshold comparison.
   - **Warm Vintage × Playful Kiroween Dual Skins**: 1-click toggle between **1987 Cream** and **Kiroween Dusk** (`Cmd/Ctrl+Shift+H`)—all 1-bit artwork dynamically re-colors on the fly.
   - **Procedural Web Audio Synthesizer**: zero external audio files; authentic retro chimes, clicks, latches, and dusk synth chords.

3. **Three Built-In Flagship Stacks (`src/presets/`)**
   - **The Attic Mac of 1987** *(6 cards · Default Landing)* — cozy interactive mystery & self-referential HyperTalk tour.
   - **Prod 502 Triage Runbook** *(5 cards)* — practical SRE incident decision deck compiled directly from Markdown via `compileMarkdownToStack`.
   - **Atkinson Darkroom & Script Lab** *(4 cards)* — 1-bit dithering showcase, Web Audio soundboard, live HyperTalk calculator, and Message Box lab.

4. **Immortal Offline Single-File `.html` Export & URL Share**
   - Exports any stack into a single standalone `.html` file embedding the **exact same TypeScript HyperTalk engine** (`esbuild` IIFE bundle, ~33 KB)—works offline forever with zero external requests.
   - Share small stacks via `#stack=` URL hash or export/import `.hcstack.json`.

5. **Custom Kiro MCP Server (`mcp/server.ts` → `dist-mcp/server.js`)**
   Exposes 4 domain-specific tools to Kiro IDE/CLI via `.kiro/settings/mcp.json`:
   - `validate_hypertalk` — AST syntax validation with line/column diagnostics & handler signatures
   - `validate_stack` — whole-stack static analysis catching syntax errors & broken `go to card` targets
   - `run_hypertalk_script` — headless sandboxed execution returning resulting card, globals, fields, audio, dialogs & trace
   - `compile_markdown_to_stack` — compiles structured Markdown docs/runbooks into validated `.hcstack.json` decks

---

## How Kiro Was Used (`.kiro/` Spec-Driven Architecture)

HyperCrypt was designed and built strictly using **Kiro Spec-Driven Development**:
- **`.kiro/steering/`**: 4 steering docs (`product.md`, `tech.md`, `structure.md` with `inclusion: always`, plus `hypertalk-grammar.md` with `fileMatch: "src/engine/**"`).
- **`.kiro/specs/`**: 3 complete EARS specification suites (`hypertalk-engine`, `stack-studio`, `export-and-mcp`), each with `requirements.md`, `design.md`, and `tasks.md`.
- **`.kiro/hooks/`**: Kiro v1 event hooks (`engine-guard.json`, `stack-validator.json`) running unit tests and preset static validation on save.
- **`.kiro/settings/mcp.json`**: Registers the local `hypercrypt` stdio MCP server (`node dist-mcp/server.js`).

---

## Architecture

```mermaid
flowchart LR
  subgraph Kiro["Kiro IDE / CLI (.kiro/)"]
    Steering["steering/ + specs/ + hooks/"]
    MCPClient["MCP Client"]
  end

  subgraph Shared["src/engine/ (Pure Zero-DOM TypeScript)"]
    HT["HyperTalk Lexer -> Parser -> Sandboxed Interpreter"]
    Bit["512x342 1-Bit Bitmap RLE + Atkinson Dither"]
    Comp["Markdown-to-Stack Compiler + Static Validator"]
    Exp["Single-File HTML Exporter"]
  end

  MCPClient <-->|stdio JSON-RPC| MCPServer["mcp/server.ts (hypercrypt-mcp)"]
  MCPServer --> Shared
  Studio["src/studio/ (React 19 Workstation)"] --> Shared
  Exp --> Offline["Standalone .html (Offline Forever)"]
```

---

## Quick Start & Testing

```bash
# Install dependencies
npm install

# Build standalone player bundle, web SPA, and MCP server
npm run build

# Start local dev server
npm run dev

# Validate all built-in stacks statically
npm run validate:presets

# Run Layer 1 (Unit + Live MCP) & Layer 2 (React Integration) tests
npm test

# Run Layer 3 (Playwright Chromium E2E + Offline Standalone .html verification)
npm run test:e2e
```
