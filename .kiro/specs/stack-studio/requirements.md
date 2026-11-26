# Requirements — `stack-studio`

## Overview
Build **HyperCrypt Studio**, a tactile 1987 Macintosh × Kiroween Dusk web workstation where users immediately play curated stacks in Browse Mode and seamlessly switch to Author Mode to paint 1-bit pixel art, edit objects, debug HyperTalk step-by-step, and toggle dual skins.

## Requirements (EARS Notation)

### REQ-1: Zero-Friction Launch & Dual Modes
- **REQ-1.1**: WHEN the application loads without a URL `#stack=` hash, THE SYSTEM SHALL open directly in **Browse Mode** on Card 1 of *The Attic Mac of 1987*.
- **REQ-1.2**: WHEN the user clicks **Author** or presses `Cmd/Ctrl+B`, THE SYSTEM SHALL reveal the Left 1-Bit & Object Tool Palette, Right Inspector/Script/Debug Drawer, and Bottom Card Filmstrip, and render dashed labels over transparent hotspot buttons.
- **REQ-1.3**: WHEN the user switches back to **Browse**, THE SYSTEM SHALL collapse Author chrome and execute object scripts upon interaction.

### REQ-2: Dual Skins (1987 Cream × Kiroween Dusk)
- **REQ-2.1**: WHEN the user toggles **1987 Cream ↔ Kiroween Dusk** (or presses `Cmd/Ctrl+Shift+H`), THE SYSTEM SHALL update all CSS theme tokens immediately, persist the preference in `localStorage`, and re-color the 1-bit pixel canvas to the active theme's ink and paper colors.

### REQ-3: Authoring, 1-Bit Painting & Atkinson Image Import
- **REQ-3.1**: WHILE in Author Mode, WHEN the user drags or resizes a button or field on the 512×342 card stage, THE SYSTEM SHALL update its coordinates smoothly and push an undoable snapshot (`Cmd/Ctrl+Z`).
- **REQ-3.2**: WHILE a 1-bit paint tool (Pencil, Eraser, Line, Rect, Bucket) is active, THE SYSTEM SHALL paint directly onto the card's 512×342 monochrome bitmap using the selected classic Mac pattern.
- **REQ-3.3**: WHEN the user opens the **Atkinson Dither Importer** and uploads/drops an image (or selects a built-in sample photo), THE SYSTEM SHALL render a real-time 1-bit Atkinson dither preview with brightness/contrast sliders and stamp it onto the card bitmap on confirm.

### REQ-4: Script Editor, Step Debugger & Classic Message Box
- **REQ-4.1**: WHEN the user edits an object or card script in the Script tab, THE SYSTEM SHALL parse in real time and display inline syntax status (`✓ Valid AST` or exact line/column error).
- **REQ-4.2**: WHEN Step Mode is enabled in the Debug tab and the user runs a script, THE SYSTEM SHALL highlight the active line, display live `global`/`local`/`it` variables, and pause until **Next Step** or **Continue** is clicked.
- **REQ-4.3**: WHEN the user opens the Message Box (`Cmd/Ctrl+M`) and presses Enter on a HyperTalk command, THE SYSTEM SHALL execute it against the active card immediately.

### REQ-5: Procedural Web Audio & Visual Transitions
- **REQ-5.1**: WHEN a script calls `play "<sound>"`, THE SYSTEM SHALL synthesize the retro sound via Web Audio API with zero external audio files (respecting an optional Mute toggle).
- **REQ-5.2**: WHEN a script sets a `visual effect` before `go to card`, THE SYSTEM SHALL animate the card transition (`dissolve`, `wipe left`, `wipe right`, `iris open`, `barn door open`).

### REQ-6: Four Flagship Built-In Stacks, Bilingual UI, Stack Map & Live MD Compiler (v2.0)
- **REQ-6.1**: THE SYSTEM SHALL provide a Stack Switcher menu and top **Showcase Dock** containing 4 EN+ZH flagship stacks: (1) *The Attic Mac of 1987* (6 cards), (2) *Starlight Cavern 1987 (1-Bit RPG)* (6 cards with `random(6)` dice duels), (3) *Prod 502 Triage Runbook* (5 cards, compiled via `markdownCompiler`), (4) *Atkinson Darkroom & Script Lab* (4 cards), plus **New Blank Stack** and **Reset Demo Stack**.
- **REQ-6.2**: THE SYSTEM SHALL provide a **Map** view rendering AST-derived card nodes, direct/conditional jump edges, and visible red dashed broken-link indicators, plus an **MD → Stack** split-screen compiler with a live `HyperTalkInterpreter` preview.
- **REQ-6.3**: THE SYSTEM SHALL support 1-click **EN / 简体中文** language switching across the Studio UI and all built-in stacks.
