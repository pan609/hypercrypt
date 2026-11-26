# HyperCrypt — Devpost Submission Copy (Kiroween 2026 · v2.0)

> Ready for `https://kiroween.devpost.com` submission form. Insert your final YouTube Demo URL once uploaded.

---

## Project Name
**HyperCrypt**

## Elevator Pitch (≤ 200 chars)
1987 Apple HyperCard & HyperTalk resurrected for 2026: 4-view 1-bit creative IDE, zero-eval AST interpreter, Atkinson dithering, offline single-file `.html` export, and a Kiro MCP compiler.

## Category / Track
- **Primary Category**: **Best Resurrection** (and Overall Prize contender + Blog Post Bonus)

## Built With (Tags)
`kiro`, `typescript`, `react`, `vite`, `mcp`, `web-audio-api`, `html5-canvas`, `vitest`, `playwright`, `vercel`

## Links
- **Live Demo URL**: `https://hypercrypt.vercel.app` *(Zero login required — opens directly into playable Browse Mode with 1-click 4-scenario Showcase Dock!)*
- **Public GitHub Repository**: `https://github.com/pan609/hypercrypt` *(MIT License, complete `/.kiro` directory & zero-install `dist-mcp/server.js`)*
- **Demo Video (YouTube, ≤ 3 min)**: `<INSERT_PUBLIC_YOUTUBE_URL_AFTER_RECORDING>`

---

## Full Project Story (Markdown for Devpost Description)

### Inspiration
In 1987, Bill Atkinson created **HyperCard** and **HyperTalk** for the Apple Macintosh—four years before the World Wide Web. It gave engineers, writers, teachers, and creators a tactile superpower: building self-contained interactive software ("Stacks") out of illustrated 512×342 1-bit cards and plain-English scripts, with zero servers and zero setup.

Apple discontinued HyperCard in 2004, leaving a real gap in modern software:
- **Static Markdown & slides** are portable, but lifeless and non-interactive.
- **Modern web apps & SaaS tools** are interactive, but heavy, login-walled, and doomed to link rot when servers shut down.

For **Kiroween 2026 (Best Resurrection)**, we brought HyperCard and HyperTalk back to life—combining warm 1987 craftsmanship with a modern 4-view creative IDE, **immortal single-file offline `.html` export**, and a **Kiro MCP server** that turns Markdown engineering docs into playable card decks.

### What It Does
- **Four-View Creative IDE (`Browse` · `Author` · `Map` · `MD → Stack`)**:
  - **Browse Mode + 4-Scenario Showcase Dock**: Land immediately in playable mode and switch with 1 click across **1987 Tour**, **1-Bit RPG**, **SRE Runbook**, and **Dither & Synth**—with a minimalist **Live Engine HUD** pulsing AST ops, globals, and Web Audio synthesis live.
  - **Author Mode (`Cmd/Ctrl+B`)**: Drag/resize buttons, fields, and invisible pixel-art hotspots; paint on the 512×342 1-bit canvas with classic Mac patterns; convert any photo using **Bill Atkinson 1-bit error-diffusion dithering**; edit scripts in a **syntax-highlighted HyperTalk editor** with live **AST Tree Inspector**, **Step Mode Debugger**, and classic **`Cmd/Ctrl+M` Message Box**.
  - **Interactive Stack Flow Map (`Map`)**: Parses every card's HyperTalk AST into a draggable 1-bit thumbnail node graph showing direct jumps, conditional `if/else` branches, and real-time red dashed broken-link indicators.
  - **Live Split-Screen Markdown Compiler (`MD → Stack`)**: Edit or paste Markdown on the left and interact with a live `HyperTalkInterpreter`-powered preview, syntax-highlighted generated HyperTalk, and static audit on the right—then import into Studio or export offline `.html` in 1 click.
- **Authentic Sandboxed HyperTalk Engine (`src/engine/`)**: Zero `eval()`, zero `new Function()`, strict 10,000-step loop budget, 32-frame call-depth guard, `random(n)`, full `openCard` / `closeCard` card lifecycle parity across Studio, Standalone `.html`, and Headless MCP.
- **Dual Skins & Bilingual UI**: Instant **1987 Cream ↔ Kiroween Dusk** 1-bit RLE re-coloring (`Cmd/Ctrl+Shift+H`) and **EN / 简体中文** toggle across the entire UI and all 4 built-in stacks.
- **Four Built-In Flagship Stacks (EN + 中文)**:
  1. *The Attic Mac of 1987* (6-card cozy mystery & live HyperTalk tour)
  2. *Starlight Cavern 1987* (6-card multi-ending 1-bit mini-RPG with HP, Gold, Relics & `random(6)` dice duels)
  3. *Prod 502 Triage Runbook* (5-card practical SRE decision deck compiled straight from Markdown)
  4. *Atkinson Darkroom & Script Lab* (4-card 1-bit dithering showcase, Web Audio soundboard & calculator lab)
- **Immortal Single-File `.html` Export**: Bundles our exact TypeScript HyperTalk engine (`src/player/standalonePlayer.ts` → ~34 KB minified IIFE) + singleton Web Audio synth + 1-bit RLE bitmaps into one standalone `.html` file that runs offline forever with zero external requests.

### How We Built It & How We Used Kiro
HyperCrypt was architected and verified using **Kiro Spec-Driven Development** (all artifacts tracked under `/.kiro/`):
1. **Steering (`.kiro/steering/`)**: Four rules—`product.md`, `tech.md`, `structure.md` (`inclusion: always`), plus `hypertalk-grammar.md` (`inclusion: fileMatch` scoped to `src/engine/**`) enforcing zero-DOM engine purity, EBNF parity (including `random(n)`), and lifecycle invariants.
2. **EARS Specs (`.kiro/specs/`)**: Three complete specification suites (`hypertalk-engine`, `stack-studio`, `export-and-mcp`) with EARS `requirements.md`, technical `design.md`, and completed `tasks.md`.
3. **Agent Hooks (`.kiro/hooks/`)**: Kiro v1 `PostFileSave` hooks (`engine-guard.json` and `stack-validator.json`) running unit tests on `src/engine/*.ts` edits, checking grammar steering sync, and running whole-stack static link validation across all 10 EN+ZH built-in stacks/templates.
4. **Custom Zero-Install MCP Server (`.kiro/settings/mcp.json` + `mcp/server.ts`)**: **`hypercrypt-mcp`** (bundled with all dependencies into zero-install `dist-mcp/server.js`) exposes 4 typed tools over stdio:
   - `validate_hypertalk({ script })`
   - `validate_stack({ stackJson })`
   - `run_hypertalk_script({ stackJson, cardIndex?, targetName?, handler?, initialGlobals?, askResponses?, answerResponses? })`
   - `compile_markdown_to_stack({ markdown, title?, author?, defaultTheme? })`

### Challenges We Ran Into
- **100% Parity Across Three Runtimes**: Keeping Studio, Exported Standalone `.html`, and Headless MCP strictly aligned required isolating `src/engine/` as 100% zero-DOM TypeScript, moving browser DOM/singleton `AudioContext` code to `src/player/standalonePlayer.ts`, wiring automatic `predev`/`pretest`/`pretypecheck` bundle hooks for clean-clone safety, and enforcing identical `closeCard`/`openCard` lifecycle semantics across all three hosts.
- **Preventing `or` Ambiguity in Classic HyperTalk**: Supporting `answer "Save?" with "Cancel" or "Save"` alongside boolean `if a or b then` required separating concatenation-level parsing inside dialog clauses from boolean precedence climbing.
- **Proving True Offline Export**: Our Playwright E2E suite intercepts the browser download of the exported `.html`, opens it in a fresh page with `page.route('**/*', r => r.abort())` (100% network blocked), toggles the dark Kiroween theme on the root document, and verifies live HyperTalk card transitions offline.

### Accomplishments That We're Proud Of
- Zero `eval()`, zero backend servers, zero external audio assets, and zero runtime errors on `https://hypercrypt.vercel.app`.
- Clean-clone safe build pipeline verified from scratch (`rm -rf src/player/generated && npm test && npm run typecheck`).
- Three layers of automated verification passing green: **Vitest Unit + Live Stdio MCP JSON-RPC + React Integration** and **Playwright Chromium E2E with Offline Standalone `.html` verification**.

### What's Next for HyperCrypt
- Shared Background Layers (classic HyperCard multi-card shared templates).
- Packaging `hypercrypt-mcp` + steering + runbook templates as a 1-click Kiro Power for engineering teams.
- Community Stack Gallery for one-click remixing of exported single-file stacks.
