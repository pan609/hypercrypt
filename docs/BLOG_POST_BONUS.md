# Resurrecting 1987 Apple HyperCard & HyperTalk with Kiro Spec-Driven Development

> *Built for **Kiroween 2026** (AWS Kiro Hackathon · Best Resurrection)*  
> **Live App**: https://hypercrypt.vercel.app · **GitHub**: https://github.com/pan609/hypercrypt

---

## Why Bring Back a 1987 Macintosh App in 2026?

Four years before Tim Berners-Lee published the first web page, Bill Atkinson shipped **HyperCard** on the Apple Macintosh. It let anyone—engineers, writers, teachers, game designers—draw crisp 512×342 1-bit cards, wire buttons in plain-English **HyperTalk**, and share self-contained interactive software ("Stacks") with zero servers.

Apple discontinued HyperCard in 2004, leaving a gap we still feel every day:
- **Static Markdown & slides** live forever, but can't branch, roll dice, capture live incident notes, or react.
- **Modern web apps & SaaS tools** are interactive, but bloated, login-walled, and break when APIs or cloud accounts disappear.

For **Kiroween 2026**, I built **HyperCrypt** to bring back that missing middle ground:
1. A tactile **512×342 1-bit browser workstation** with warm **1987 Cream** and playful **Kiroween Dusk** dual skins (plus full EN / 中文 support).
2. A genuine, hand-written **HyperTalk Lexer → Recursive-Descent Parser → Sandboxed Async Interpreter** (zero `eval()`, 10,000-step infinite-loop guard) with a live **Syntax-Highlighted Editor**, **AST Tree Inspector**, **Step Debugger**, and **Stack Flow Map**.
3. True **Bill Atkinson 1-bit error-diffusion dithering** (distributing 6/8 of quantization error across 6 neighbors for airy vintage Macintosh tones).
4. **Immortal Single-File `.html` Export**: One click bundles our exact TypeScript engine (~33 KB minified IIFE) + 1-bit RLE bitmaps + Web Audio synth into a standalone `.html` file that runs offline forever.
5. **A Live Markdown → HyperCard Compiler**—available both in-browser (`MD → Stack`) and inside **Kiro IDE** via our custom `hypercrypt-mcp` server.

---

## How Kiro Spec-Driven Development Shaped the Architecture

Instead of vibe-coding a messy monolith and patching bugs on deadline night, we structured the entire repository around `.kiro/`:

### 1. Steering Files (`.kiro/steering/`) as Architectural Guardrails
We wrote four steering files:
- `product.md`, `tech.md`, and `structure.md` (`inclusion: always`) locked down hard constraints: **zero `eval()`**, **strict engine purity** (nothing in `src/engine/` may import React or touch `window`/`document`), and a 3-layer test discipline.
- `hypertalk-grammar.md` (`inclusion: fileMatch` scoped to `src/engine/**`) documented the exact HyperTalk v1.0 EBNF subset—including `random(n)`, container mutations (`put ... into/before/after`), and operator precedence—so every engine change stayed backward-compatible.

### 2. Three Complete EARS Specs (`.kiro/specs/`)
Before writing production code, we authored full `requirements.md` (EARS notation), `design.md`, and `tasks.md` across three focused specs:
- `hypertalk-engine` (lexer, parser, sandboxed interpreter, 1-bit bitmap RLE, Atkinson dithering)
- `stack-studio` (512×342 workstation, dual skins, procedural Web Audio, debugger, presets)
- `export-and-mcp` (single-file HTML bundler, Markdown compiler, stdio MCP server)

### 3. Event-Driven Kiro v1 Hooks (`.kiro/hooks/`)
Two `PostFileSave` hooks protected quality automatically:
- `engine-guard.json`: saving any `src/engine/*.ts` file automatically runs `npm run test:unit` and checks whether `hypertalk-grammar.md` needs a sync.
- `stack-validator.json`: saving any built-in stack in `src/presets/*.ts` automatically runs `npm run validate:presets` across all EN & ZH decks to catch syntax errors or broken `go to card` targets immediately.

### 4. Custom Kiro MCP Server (`.kiro/settings/mcp.json` + `mcp/server.ts`)
We built **`hypercrypt-mcp`** over stdio (`esbuild`-bundled to `dist-mcp/server.js` for instant launch) sharing the exact `src/engine/` modules:
- `validate_hypertalk` — AST validation with exact line/column diagnostics
- `validate_stack` — whole-stack static link & syntax auditing
- `run_hypertalk_script` — headless sandbox execution returning final card, globals, fields, audio events, dialogs & trace
- `compile_markdown_to_stack` — turns any Markdown incident runbook or tutorial into a validated `.hcstack.json` card stack

---

## Proving True Offline Immortality with Playwright

One of my favorite engineering details is how we verify the Single-File `.html` Export in `tests/e2e/hypercrypt.spec.ts`:
1. Playwright clicks **Export → Export Single-File .html** in the live Studio and captures the downloaded file.
2. It opens a fresh browser page with **`page.route('**/*', route => route.abort())`**—blocking 100% of network requests.
3. It loads the exported HTML directly and clicks through real HyperTalk buttons to assert zero console errors and 100% parity offline.

Alongside that E2E check, Vitest runs **22 unit, live stdio MCP JSON-RPC, and React integration tests** in under 2 seconds.

---

## Try It Yourself
- **Live Demo (Zero Login)**: https://hypercrypt.vercel.app
- **Open-Source Repo (MIT + full `/.kiro`)**: https://github.com/pan609/hypercrypt

Switch between **1987 Tour**, **1-Bit RPG**, **SRE Runbook**, and **Dither & Synth** right from the top dock, inspect the live **Flow Map** or **AST Tree**, edit Markdown live in **MD → Stack**, and export your own offline forever `.html` stack!
