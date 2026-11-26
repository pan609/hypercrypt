---
inclusion: always
---

# HyperCrypt — Product Steering (v2.0)

## Product Vision
HyperCrypt resurrects **1987 Apple HyperCard & HyperTalk** for the modern web—bridging the gap between static Markdown documents and heavy cloud-dependent web apps. Users play and author 512×342 1-bit interactive card stacks in the browser, inspect live HyperTalk ASTs and branching Flow Maps, compile Markdown live into playable stacks, export any stack as a single immortal offline `.html` file, and automate validation/compilation from Kiro IDE via `hypercrypt-mcp`.

## Core Product Principles
1. **Zero Empty-State Friction & Instant Breadth**: First load opens directly into **Browse Mode** on Card 1 of *The Attic Mac of 1987* with a clean top **Showcase Dock** exposing all 4 cross-domain flagship stacks immediately.
2. **Warm Vintage × Playful Kiroween Aesthetic + Bilingual Support**:
   - Dual skins: **1987 Cream** (`#FBF8F1` / `#24201B` / `#D96B27`) and **Kiroween Dusk** (`#21193A` / `#F3EEFF` / `#FF9E44`).
   - Full **EN / 简体中文** toggle covering the Studio UI and all 4 built-in stacks.
3. **Four-View Creative IDE**:
   - **Browse** (zero-friction player + minimalist Live Engine HUD)
   - **Author** (object drag/resize, 1-bit paint tools, Atkinson dither importer, syntax-highlighted Script Editor, live AST Tree viewer, Step Debugger, Card Filmstrip)
   - **Map** (AST-derived draggable card flow graph with direct/conditional edges and broken-link radar)
   - **MD → Stack** (live split-screen Markdown compiler with real HyperTalk preview, generated code view, and static audit)
4. **Four Built-In Flagship Stacks (EN + 中文)**:
   - *The Attic Mac of 1987* (6-card playful mystery & live tour)
   - *Starlight Cavern 1987 (1-Bit RPG)* (6-card branching mini-RPG with HP, Gold, Relics & `random(6)` dice duels)
   - *Prod 502 Triage Runbook* (5-card practical SRE decision deck compiled from Markdown)
   - *Atkinson Darkroom & Script Lab* (4-card 1-bit dithering, retro synth & calculator lab)
5. **Immortal Portability**: Every stack exports cleanly to a standalone offline `.html` file with zero external CDN dependencies.
