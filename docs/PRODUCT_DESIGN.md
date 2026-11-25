# HyperCrypt — Stage 1: Product Design Document (PRD)

> **Contest**: Kiroween 2026 (AWS Kiro · $100,000 Prize Pool)  
> **Target Track**: **Best Resurrection** (Primary) + **Overall Top 3** (Contender)  
> **Deployment**: Vercel (Static SPA, zero backend, instant load)  
> **Date**: 2026-11-25  
> **Status**: Draft for Gate 1 Review

---

## 1. Product Vision & Positioning

### One-Liner
**HyperCrypt** resurrects **1987 Apple HyperCard & HyperTalk** for the modern web—combining an authentic 1-bit creative studio, a real plain-English HyperTalk interpreter, single-file offline HTML export, and a Kiro MCP compiler that turns modern Markdown docs into playable card stacks.

### The Real Problem We Solve (Why Judges Care Beyond Nostalgia)
In 1987, Bill Atkinson's HyperCard gave non-programmers and engineers alike a superpower we have largely lost: **building small, tactile, self-contained interactive software ("Stacks") in minutes using plain English, with zero servers and zero frameworks.**

Today, if you want to create:
- an **interactive incident runbook** (click symptoms → branch to fixes → log notes),
- a **branching onboarding walkthrough or classroom quiz**, or
- a **retro playable zine / interactive story**,

you are stuck between **static Markdown** (boring, non-interactive) and **heavy modern web apps / SaaS tools** (Notion, React, Vercel databases—fragile, login-walled, dependent on third-party clouds).

**HyperCrypt brings back the golden middle ground:**
1. **Zero-setup web studio**: Open the URL and play or build immediately—no account, no backend.
2. **Real plain-English scripting (`HyperTalk`)**: Readable by humans, safely sandboxed, debuggable step-by-step.
3. **Immortal Single-File `.html` Export**: Export any Stack into one offline `.html` file that runs in any browser forever—no CDN, no server, no link rot.
4. **2026 AI Bridge (`hypercrypt-mcp`)**: Inside **Kiro IDE**, engineers can compile any existing Markdown runbook or tutorial directly into a validated, playable HyperCrypt Stack and test its HyperTalk scripts headlessly.

---

## 2. Target Users & Core Journeys

| User Persona | Core Need | 60-Second Success Moment |
| :--- | :--- | :--- |
| **Hackathon Judge / Explorer** | Understand the project's soul, technical depth, and Kiro integration within 3–5 minutes | Opens URL → immediately plays 3 cards of *The Crypt of 1987* → flips to **Haunted CRT** skin → opens Script Inspector to edit 1 line of HyperTalk and sees it run live → exports a standalone `.html` file |
| **Engineer / Technical Writer** | Turn dry Markdown runbooks or onboarding docs into interactive branching checklists | Uses `hypercrypt-mcp` in Kiro IDE to compile `runbook.md` into a Stack, validates links/scripts, opens it in HyperCrypt, and shares a single offline HTML file with the team |
| **Indie Creator / Educator** | Build retro 1-bit interactive stories, quizzes, or zines without wrestling CSS/JS build tools | Drops a photo onto a card (auto-converted via **Atkinson 1-bit Dithering**), draws pixel art, wires 3 buttons with plain-English HyperTalk, and shares via URL hash |

---

## 3. Core Product Features & Scope (MVP Contract)

### 3.1 Dual-Mode Workbench (Browse vs. Author)
Mirroring the iconic 1987 HyperCard mental model:

1. **Browse Mode (Default on load — instant playability)**
   - Click buttons, type into editable fields, trigger `on mouseUp` / `on openCard` / `on closeCard` scripts.
   - Classic visual card transitions (`dissolve`, `wipe left`, `wipe right`, `iris open`, `barn door open`).
   - Authentic modal dialogs (`answer` / `ask`) and zero-dependency Web Audio retro Macintosh sound effects.
2. **Author Mode (1-click toggle in top bar)**
   - **Object Layer**: Add, select, drag, resize, duplicate, and delete:
     - **Buttons**: Classic Rounded, Shadow, Transparent (invisible hotspot over pixel art!), Checkbox.
     - **Fields**: Text Box (editable or locked), Scrolling Text, Static Label.
     - Property Inspector for name, label/text, style, visibility, font size, and direct **"Edit Script..."** button.
   - **1-Bit Paint Layer** (512 × 342 classic Macintosh 9-inch card resolution, crisply scaled):
     - Tools: Pencil, Eraser, Line, Rectangle (stroke/fill), Flood Fill Bucket.
     - Classic Mac 1-bit Fill Patterns (Black, White, 50% Gray Stipple, Diagonal Hatch, Checkerboard).
     - **Atkinson Dithering Image Importer**: Drag & drop or upload any PNG/JPG → instant real-time **Bill Atkinson 1-bit dithering** (with threshold/contrast slider) stamped directly onto the card bitmap!
     - Multi-step Undo/Redo (`Cmd+Z` / `Cmd+Shift+Z`).
   - **Card Filmstrip / Navigator**: Reorder, add, duplicate, rename, delete cards, and preview thumbnails.

### 3.2 Real HyperTalk Engine & Live Debugger
A genuine custom **Lexer → Recursive-Descent Parser → AST → Sandboxed Async Interpreter** (zero `eval`, zero `new Function`), shared between the browser app, the exported standalone HTML runtime, and `hypercrypt-mcp`.

#### Supported Authentic HyperTalk Subset (v1.0)
- **Event Handlers**: `on mouseUp`, `on openCard`, `on closeCard`, `on enterKey`, plus user-defined handlers `on <name> [p1, p2]`
- **Navigation & Effects**:
  - `visual effect dissolve | wipe left | wipe right | iris open | barn door open`
  - `go to next card` / `go to prev card` / `go to first card` / `go to last card`
  - `go to card "Vault"` / `go to card 2`
- **Variables & Containers**:
  - `global <varName>` (persists across cards in the stack)
  - `put <expr> into <var | field "Name">`
  - `put <expr> before <var | field "Name">`
  - `put <expr> after <var | field "Name">`
  - `add <expr> to <container>` / `subtract <expr> from <container>` / `multiply <container> by <expr>` / `divide <container> by <expr>`
  - Special HyperTalk built-ins: `it` (result of `ask`/`answer`), `empty`, `return`, `quote`, `the number of cards`, `the name of this card`, `the text of field "X"`, `the label of button "X"`
- **Expressions & Control Flow**:
  - Operators: `+`, `-`, `*`, `/`, `mod`, `&` (string concat), `&&` (concat with space)
  - Comparisons & logic: `=`, `<>`, `is`, `is not`, `<`, `>`, `<=`, `>=`, `contains`, `and`, `or`, `not`
  - `if <cond> then <stmt>` and multi-line `if <cond> then ... [else ...] end if`
  - `repeat <n> times ... end repeat`, `repeat with <var> = <start> to <end> ... end repeat`, `repeat while <cond> ... end repeat`, `exit repeat`
- **UI, Dialogs, Audio & Timing**:
  - `show button "X"` / `hide button "X"` / `show field "X"` / `hide field "X"`
  - `set the label of button "X" to <expr>` / `set the text of field "X" to <expr>`
  - `answer <prompt> [with <btn1> [or <btn2>]]` (classic Mac alert modal; stores chosen button in `it`)
  - `ask <prompt> [with <default>]` (classic Mac input modal; stores user text in `it`)
  - `play "beep" | "chime" | "click" | "unlock" | "organ" | "spooky" | "error"` (Web Audio API synth)
  - `wait <n> milliseconds` / `wait <n> seconds`
- **Developer Tools Built Into the Studio**:
  - **Script Editor**: HyperTalk syntax highlighting, line numbers, instant parse error underlines, one-click snippet insertion.
  - **Debugger & Trace Panel**: Execution log, live watch table for `global` / `local` / `it` variables, and **Step Mode** (step through AST statements one-by-one with active line highlight!).
  - **Classic Message Box (`Cmd+M`)**: Type any single HyperTalk command (e.g. `go to card 3` or `play "spooky"`) and press Enter to execute immediately.
- **Hard Safety Guarantees**:
  - Max 10,000 AST steps per event invocation (prevents accidental infinite loops from ever hanging the tab).
  - Max 32 call-stack frames.

### 3.3 Dual Visual Skins (Warm Vintage × Playful Kiroween)
1-click toggle in the top menu bar (persisted in `localStorage`):
1. **Classic 1987 Cream (Macintosh Platinum)**: Warm vintage cream paper (`#F6F2E7`), soft linen desktop stipple (`#E7E1D3`), crisp warm-charcoal ink (`#22201D`), and subtle pumpkin-amber highlight accents—sunny, nostalgic, and inviting.
2. **Kiroween Dusk (Playful Twilight Mode)**: Inspired by Kiro's official Kiroween palette—cozy midnight violet (`#18132B`), soft moonlight ink (`#F0E9FF`), lilac borders (`#A78BFA`), warm pumpkin-orange accents (`#FF9E44`), and gentle retro CRT glow (charming arcade-Halloween vibe, zero grim horror).

### 3.4 Portability & Export
- **Export Single-File `.html`**: Bundles the active Stack JSON + minimal zero-dependency runtime into one standalone `.html` file. Double-clicking it locally (even offline) launches the complete playable stack with HyperTalk, transitions, and Web Audio.
- **Share Link (URL Hash)**: Compresses stack state into `#stack=<encoded>` and copies the shareable URL (with clear size feedback if large pixel bitmaps exceed safe URL length).
- **Save / Open `.hcstack.json`**: Export or import human-readable JSON stacks; auto-save current work to `localStorage` with a one-click **"Reset Demo Stack"** recovery option.

### 3.5 Custom Kiro MCP Server (`packages/hypercrypt-mcp`)
Designed so judges reviewing `.kiro/settings/mcp.json` see a genuinely useful, domain-specific MCP toolset—not a toy hello-world:

| MCP Tool | Purpose | Real Workflow Value |
| :--- | :--- | :--- |
| `validate_hypertalk` | Parse HyperTalk source via the shared parser and return structured diagnostics + handler signatures | Kiro checks generated scripts before saving |
| `run_hypertalk_script` | Execute a script against a mock/provided Stack state in the shared sandbox and return final state + trace + audio/dialog events | Automated headless verification of card logic inside Kiro |
| `validate_stack` | Validate `.hcstack.json` schema, broken `go to card` targets, missing button/field references, and script syntax across every card | Catches dead links and script typos across an entire stack |
| `compile_markdown_to_stack` | Convert a structured Markdown document (`## Card: Name`, body text, `- [Button Label -> Target Card]`, optional `hypertalk` code blocks) into a complete, auto-laid-out `.hcstack.json` | Turns any repo's README or incident runbook into an interactive HyperCrypt Stack in 1 command |

---

## 4. Three Built-In Flagship Stacks (Zero Empty-State Friction)

Judges open the deployed Vercel URL and immediately land on **Stack #1** in Browse Mode, with a clean **"Stacks" menu** to switch among all 3 built-in stacks or start a blank stack:

1. **`The Attic Mac of 1987`** *(Default Landing · 6 Cards · Playful Retro Mystery + Interactive Tour)*
   - **Theme**: You switch on a forgotten 1987 Macintosh in a cozy attic. A friendly 1-bit pixel spirit waves from the screen! Solve 3 charming micro-puzzles (tap the glowing 3.5" floppy disk hotspot on the dithered 1-bit Mac illustration, enter the launch year `1987` via `ask`, toggle 3 cozy magic switches tracked in a `global` variable) to wake up HyperCard for 2026.
   - **Meta Twist**: Every card has a friendly **"Peek Script"** button or one-click switch to Author Mode so judges immediately see the clean 10-line HyperTalk driving the puzzle they just played.
2. **`Prod 502 Triage Runbook`** *(Real-World Utility · 5 Cards · Generated via `hypercrypt-mcp`)*
   - **Theme**: Practical SRE incident response decision tree (Check CDN → Inspect Upstream Latency → Rollback Checklist → Generate Postmortem Summary).
   - **Value Proof**: Demonstrates how `compile_markdown_to_stack` converts real engineering documentation into an interactive, state-tracking, offline-exportable tool.
3. **`Atkinson Darkroom & Script Lab`** *(Creative & Technical Playground · 4 Cards)*
   - **Card 1**: Interactive **Atkinson 1-bit Dithering** showcase (drop your own image or click 3 preset images to compare raw vs. Atkinson 1-bit dither).
   - **Card 2**: 1987 Retro Web Audio Soundboard (clickable pixel piano/SFX pads powered by `play`).
   - **Card 3**: Live HyperTalk Mini-Calculator / Loop Visualizer (ideal for opening the **Step Debugger** and watching variables mutate line by line).
   - **Card 4**: Classic Message Box Cheat Sheet & Quick Authoring Sandbox.

---

## 5. Explicit Non-Goals (Protecting Our 9-Day Schedule)

To guarantee **launch-ready polish** rather than half-finished bloat, we explicitly exclude:
- ❌ Backend servers, databases, OAuth logins, or cloud accounts (100% static client-side + Vercel deploy).
- ❌ Real-time multiplayer / CRDT collaboration.
- ❌ Legacy binary `.hc` Classic Mac OS HFS disk-image decompilation (we use open `.hcstack.json` + Markdown-to-Stack MCP compilation).
- ❌ Arbitrary JavaScript `eval` or external network calls from HyperTalk scripts (strictly sandboxed).
- ❌ Full mobile touch authoring studio (Browse mode works cleanly on smaller screens; full Authoring Studio targets desktop `≥ 1024px`).

---

## 6. Success Metrics & Judging Alignment

| Kiroween Judging Criterion | How HyperCrypt Maximizes Score |
| :--- | :--- |
| **Potential Impact / Value** | Solves the gap between static Markdown and bloated SaaS apps with offline single-file HTML interactive decks + Markdown-to-Stack runbook compiler (`Prod 502 Triage Runbook` proves practical adoption). |
| **Tech Implementation & Use of Kiro** | Real hand-written HyperTalk Lexer/Parser/AST Sandbox + Atkinson Dithering + Single-File HTML bundler + complete `.kiro/` (`steering/`, 3 EARS `specs/`, working `hooks/`, and domain-specific `hypercrypt-mcp` sharing the exact TypeScript engine). |
| **Quality & Design** | Unmistakable 1-bit Classic 1987 Mac aesthetic + 1-click **Haunted CRT** Kiroween mode, procedural Web Audio SFX, 3 polished zero-error built-in stacks, and 3-layer automated tests (Unit + Integration + Playwright E2E). |

---

## 7. Gate 1 Decisions Needed Before Moving to Stage 2 (UI Design)

1. **Default Landing Experience**: Confirm landing directly on Card 1 of **`The Crypt of 1987`** in Browse Mode (so judges immediately click and experience magic within 3 seconds, instead of seeing a dry empty canvas).
2. **3 Built-In Stacks**: Confirm the trio (*The Crypt of 1987*, *Prod 502 Triage Runbook*, *Atkinson Darkroom & Script Lab*).
3. **HyperTalk Scope & Non-Goals**: Confirm the above feature boundaries (zero backend, static Vercel deploy, single-file HTML export, 4-tool MCP server).
