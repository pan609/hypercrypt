# HyperCrypt — Devpost Submission Copy (Kiroween 2026)

> Copy-paste ready for `https://kiroween.devpost.com` submission form. Replace `<VERCEL_URL>` and `<YOUTUBE_URL>` once live.

---

## Project Name
**HyperCrypt**

## Elevator Pitch (≤ 200 chars)
1987 Apple HyperCard & HyperTalk resurrected for 2026: 1-bit Atkinson dithering, sandboxed HyperTalk debugger, immortal offline single-file `.html` export, and a Kiro MCP Markdown-to-Stack compiler.

## Category / Track
- **Primary Category**: **Best Resurrection** (and Overall Prize contender)

## Built With (Tags)
`kiro`, `typescript`, `react`, `vite`, `mcp`, `web-audio-api`, `html5-canvas`, `vitest`, `playwright`, `vercel`

## Links
- **Live Demo URL**: `<VERCEL_URL>` *(Zero login required — opens directly into playable Browse Mode!)*
- **Public GitHub Repository**: `https://github.com/pan609/hypercrypt` *(MIT License, includes complete `/.kiro` directory)*
- **Demo Video (YouTube, ≤ 3 min)**: `<YOUTUBE_URL>`

---

## Full Project Story (Markdown for Devpost Description)

### Inspiration
In 1987, Bill Atkinson created **HyperCard** and **HyperTalk** for the Apple Macintosh—four years before the World Wide Web. It gave engineers, writers, teachers, and kids a magical superpower: building small, tactile, interactive personal software ("Stacks") out of illustrated 512×342 1-bit cards and plain-English scripts, with zero servers and zero setup.

Apple discontinued HyperCard in 2004, leaving a huge gap in modern software:
- **Static Markdown & slides** are portable, but lifeless and non-interactive.
- **Modern web apps & SaaS tools** are interactive, but heavy, login-walled, and doomed to link rot when servers shut down.

For **Kiroween 2026 (Best Resurrection)**, we brought HyperCard and HyperTalk back to life—preserving its warm 1987 tactile craft while bridging it to 2026 with **immortal offline single-file `.html` export** and a **Kiro MCP server** that turns modern Markdown documentation into playable card decks.

### What It Does
- **Zero-Friction 512×342 1-Bit Studio (`Browse` & `Author` Modes)**: Land immediately in playable Browse Mode on *The Attic Mac of 1987*, or press `Cmd/Ctrl+B` to author buttons, fields, invisible pixel-art hotspots, and 1-bit drawings with undo/redo.
- **Authentic Sandboxed HyperTalk Engine + Live Step Debugger**: A real hand-written Lexer, Recursive-Descent Parser, and Async Sandboxed Interpreter (zero `eval()`, strict 10,000-step loop budget) supporting `on mouseUp/openCard`, `global`, `put ... into/before/after`, math, `if/else`, `repeat`, `visual effect`, `go to card`, `show/hide`, `ask`/`answer` classic Mac modals, `play`, `wait`, live **Step Mode** line-by-line debugging, and the classic **`Cmd/Ctrl+M` Message Box**.
- **True Bill Atkinson 1-Bit Error-Diffusion Dithering**: Drop or upload any photo to dither it live using Atkinson's original 6/8 error-diffusion formula (with Brightness/Contrast sliders and side-by-side Threshold comparison).
- **Warm 1987 Cream ↔ Playful Kiroween Dusk Dual Skins**: Switch instantaneously (`Cmd/Ctrl+Shift+H`)—because card artwork is stored as pure lossless 1-bit RLE bitmaps, every pixel illustration dynamically re-colors between archival cream ink and midnight Kiroween violet!
- **Three Built-In Flagship Stacks**:
  1. *The Attic Mac of 1987* (6-card cozy mystery & live HyperTalk tour)
  2. *Prod 502 Triage Runbook* (5-card practical SRE decision deck compiled straight from Markdown)
  3. *Atkinson Darkroom & Script Lab* (4-card 1-bit dithering, procedural Web Audio soundboard & calculator lab)
- **Immortal Single-File `.html` Export**: One click downloads a self-contained `.html` file embedding our exact TypeScript HyperTalk engine (~33 KB minified IIFE) + Web Audio synth—works offline forever with zero external requests.

### How We Built It & How We Used Kiro
HyperCrypt was engineered from the ground up with **Kiro Spec-Driven Development** (all artifacts committed under `/.kiro/`):
1. **Steering (`.kiro/steering/`)**: Four living project rules—`product.md`, `tech.md`, `structure.md` (`inclusion: always`), plus `hypertalk-grammar.md` (`inclusion: fileMatch` scoped to `src/engine/**`) enforcing EBNF grammar parity, zero-DOM engine purity, and sandbox budgets.
2. **EARS Specs (`.kiro/specs/`)**: Three complete specification suites—`hypertalk-engine`, `stack-studio`, and `export-and-mcp`—each structured into EARS-notation `requirements.md`, technical `design.md`, and wave-ordered `tasks.md`.
3. **Agent Hooks (`.kiro/hooks/`)**: Kiro v1 `PostFileSave` hooks (`engine-guard.json` and `stack-validator.json`) that automatically run Vitest unit tests when `src/engine/*.ts` changes, remind to sync the grammar steering doc, and run whole-stack static link validation on `src/presets/*.ts`.
4. **Custom MCP Server (`.kiro/settings/mcp.json` + `mcp/server.ts`)**: We built **`hypercrypt-mcp`** (pre-bundled to `dist-mcp/server.js` over stdio) exposing 4 real tools sharing our exact `src/engine/` codebase:
   - `validate_hypertalk` — AST parsing & exact line/column syntax diagnostics
   - `validate_stack` — whole-stack static analysis catching broken `go to card` links & script errors
   - `run_hypertalk_script` — headless sandbox execution returning resulting card, globals, fields, audio, dialogs & execution trace
   - `compile_markdown_to_stack` — compiles any Markdown runbook or tutorial into a validated `.hcstack.json` deck

### Challenges We Ran Into
- **100% Parity Between Studio, Exported HTML, and MCP**: Instead of maintaining two separate HyperTalk engines, we isolated `src/engine/` as pure zero-DOM TypeScript and added a fast `esbuild` step (`npm run build:player`) that bundles `standalonePlayer.ts` into a 33 KB IIFE embedded inside every exported `.html` file.
- **Preventing `or` Ambiguity in Classic HyperTalk**: Supporting `answer "Save?" with "Cancel" or "Save"` alongside boolean `if a or b then` required careful precedence separation in our recursive-descent parser.
- **Proving True Offline Export**: In our Playwright E2E suite, we intercept the browser download of the exported `.html` file, open it in a fresh page with `page.route('**/*', r => r.abort())` (100% network blocked), and verify interactive button clicks and card transitions succeed offline.

### Accomplishments That We're Proud Of
- Zero `eval()`, zero backend servers, zero external audio assets, and zero runtime errors.
- Three full layers of automated tests passing green: **Vitest Unit + Live Stdio MCP JSON-RPC + React Integration (19/19)** and **Playwright Chromium E2E including offline standalone `.html` verification**.
- Dogfooding our own `compile_markdown_to_stack` compiler to generate the built-in *Prod 502 Triage Runbook* stack.

### What's Next for HyperCrypt
- Background Layers (shared card templates, just like HyperCard's iconic Background mode).
- Optional Kiro Power packaging (`hypercrypt-power`) bundling our MCP server, steering rules, and Markdown runbook templates for instant one-click installation across engineering teams.
- Community Stack Gallery where exported single-file stacks can be remixed with one click.
