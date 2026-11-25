# HyperCrypt — ≤ 3-Minute YouTube Demo Script & Shotlist (Kiroween 2026)

> **Hard Limit**: Strictly **≤ 3:00** (Target runtime: **2:40 – 2:48** for safe margin!)  
> **Resolution**: 1920×1080 (16:9), browser zoom 110% so 512×342 card & HyperTalk code look razor-sharp.  
> **Audio**: Clear English voiceover (or natural AI TTS) + gentle live Web Audio SFX from the app.

---

## Shot-by-Shot Storyboard

### 0:00 – 0:22 | Hook & The Problem (Instant Visual Impact)
- **Visual**: Open the live Vercel URL (`https://hypercrypt.vercel.app`) full-screen. Land directly on Card 1 of **The Attic Mac of 1987** in warm **1987 Cream** skin. Hover & tap the smiling 1-bit pixel spirit inside the vintage Macintosh → retro chime + classic Mac modal pops up → click **Wake HyperCard →** → iris-open transition to Card 2.
- **Narration**:
  > "In 1987, Apple's HyperCard let anyone build interactive personal software in plain English—with zero servers and zero setup. Today, we're stuck between static Markdown and bloated SaaS apps. Meet **HyperCrypt**: 1987 HyperCard and HyperTalk resurrected for 2026—running in your browser, exporting to a single immortal offline HTML file, and supercharged by **Kiro**."

### 0:22 – 0:55 | Live HyperTalk Engine, Dual Skins & Step Debugger
- **Visual**:
  1. Click **Kiroween Dusk** in the top menu bar — watch the warm 1987 Cream studio and the 1-bit pixel art instantaneously transform into cozy midnight violet & pumpkin orange!
  2. Jump to Card 3 (**Time Dial**), click **Enter Launch Year...**, type `1987` into the classic `ask` modal → unlocks **Continue to Circuit →**.
  3. Click **Peek Script** (enters **Author Mode**), show the clean plain-English HyperTalk in the right Script tab (`✓ Valid AST`), then switch to Card 5 (**HyperTalk Mirror**), open the **Debug** tab, check **Step Mode**, click **▶ Run Boot Sequence**, and step 2 AST lines watching `bootRuns` and the execution trace update live!
- **Narration**:
  > "There's zero `eval()` here. Under the hood is a real, hand-written HyperTalk lexer, recursive-descent AST parser, and sandboxed async interpreter with a 10,000-step infinite-loop guard. Flip to **Kiroween Dusk** and every 1-bit pixel re-colors live. Switch to **Author Mode** to inspect or edit any script with real-time AST diagnostics—or enable **Step Mode** to walk through HyperTalk line by line."

### 0:55 – 1:25 | True Bill Atkinson 1-Bit Dithering & Authoring Studio
- **Visual**:
  1. In Author Mode, open the left 1-Bit Paint palette and click **Dither Img**.
  2. Toggle between **Atkinson 1987** vs **Threshold**, drag the contrast slider (or drop a photo!), and click **Stamp onto Active Card**.
  3. Press `Cmd+M` to open the classic **Message Box**, type `play "chime"` and hit Enter.
- **Narration**:
  > "Bill Atkinson invented both HyperCard and 1-bit Atkinson dithering. HyperCrypt brings back his exact 6/8 error-diffusion formula—drop any photo to convert it into crisp 512×342 1-bit Macintosh art, or run live HyperTalk directly from the classic Command-M Message Box."

### 1:25 – 1:55 | Real-World Utility & Immortal Single-File `.html` Export
- **Visual**:
  1. Open the **Stack** menu and switch to **Prod 502 Triage Runbook** (5 cards, compiled from Markdown). Click `Recent Deploy (<15m)` → branches to `Check Rollback`, type an incident note into the live field.
  2. Click **Export ▾ → Export Single-File .html**.
  3. Open the downloaded `.html` file directly from local disk (`file:///.../prod-502-triage-runbook.html`) in a fresh browser tab and click through a card transition to prove it runs 100% standalone offline!
- **Narration**:
  > "HyperCrypt isn't just nostalgia—it solves a real workflow gap. Here's a production 502 incident runbook compiled straight from Markdown into an interactive decision deck. Click **Export .html** and HyperCrypt bundles our exact TypeScript engine into one self-contained file—double-click it offline today or twenty years from now, with zero cloud lock-in."

### 1:55 – 2:32 | Deep Kiro Integration (`.kiro/` Specs, Steering, Hooks & `hypercrypt-mcp`)
- **Visual**: Switch screen to **Kiro IDE** with the `hypercrypt` repository open:
  1. Quickly expand `.kiro/` in the sidebar showing `steering/` (4 files), `specs/` (`hypertalk-engine`, `stack-studio`, `export-and-mcp` with EARS `requirements.md` / `design.md` / `tasks.md`), `hooks/` (`engine-guard.json`, `stack-validator.json`), and `settings/mcp.json`.
  2. Trigger a quick save or show the Kiro Hook running `npm run test:unit` / `npm run validate:presets` green.
  3. In Kiro Chat, invoke our custom **`hypercrypt` MCP server** (`compile_markdown_to_stack` + `validate_stack` + `run_hypertalk_script`) to compile a Markdown snippet into a validated stack and test a button click headlessly!
- **Narration**:
  > "We built HyperCrypt from day one using **Kiro Spec-Driven Development**. Our `.kiro` directory holds persistent steering rules, three full EARS specs, v1 Agent Hooks that automatically test engine edits and validate stacks on save, and our custom **`hypercrypt-mcp`** server. Right inside Kiro, we can compile any Markdown doc into a HyperCrypt stack, validate every card link, and execute HyperTalk scripts headlessly."

### 2:32 – 2:48 | Closing & Call to Action
- **Visual**: Split/final shot back on HyperCrypt's live Vercel app (Card 6: **Resurrected!**) with a subtle overlay showing: `hypercrypt.vercel.app` · `github.com/pan609/hypercrypt` · `19/19 Vitest + Live MCP + Playwright Offline E2E`.
- **Narration**:
  > "From 1987's HyperCard to 2026's spec-driven AI workflows—**HyperCrypt** brings personal, offline-forever hypermedia back to life. Try the live app on Vercel, export your own stack, and explore the open-source repo on GitHub. Thanks for watching!"
