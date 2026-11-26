---
inclusion: always
---

# HyperCrypt — Technology & Quality Steering (v2.0)

## Stack
- **Frontend**: Vite + React 19 + TypeScript (strict mode) + CSS custom properties (`data-hc-theme="classic" | "kiroween"`)
- **Pure Engine (`src/engine/`)**: Pure zero-dependency, zero-DOM TypeScript shared across the browser Studio, the standalone offline player (`src/player/`), Vitest suite, and Node MCP server (`mcp/server.ts`).
- **Standalone Offline Player (`src/player/`)**: Isolated DOM/Canvas/Web Audio runtime (`src/player/standalonePlayer.ts`) bundled by `esbuild` (`npm run build:player`) into `src/player/generated/standalonePlayer.bundle.txt` (~34 KB IIFE) and auto-generated via `predev` / `pretest` / `pretypecheck` hooks.
- **Audio**: Procedural Web Audio API singleton synthesizer (`src/studio/audio/retroAudio.ts` & `src/player/standalonePlayer.ts`)—zero external audio assets.
- **MCP Server (`mcp/server.ts`)**: Official `@modelcontextprotocol/sdk` over stdio transport, bundled with all dependencies into zero-install `dist-mcp/server.js` (committed to repo for instant Kiro MCP startup).
- **Deployment**: Static SPA on Vercel (`https://hypercrypt.vercel.app`, `npm run build` → `dist/`). Zero backend servers, zero runtime environment secrets required.

## Hard Engineering Guardrails
1. **Never use `eval`, `new Function`, or raw `innerHTML` with user/stack strings.** All HyperTalk runs exclusively through our custom AST interpreter (`src/engine/interpreter.ts`).
2. **Strict Sandbox Limits**: Every script invocation enforces `maxSteps = 10_000` and `maxCallDepth = 32` to guarantee immunity against infinite loops.
3. **Strict Engine Purity**: Files inside `src/engine/` MUST NOT import `react`, `react-dom`, or reference `window` / `document` directly. Browser-specific standalone runtime code lives strictly in `src/player/`.
4. **Full Lifecycle Parity**: Studio (`useStudioStore.tsx`), Standalone Player (`src/player/standalonePlayer.ts`), and Headless MCP Runner (`src/engine/headlessHost.ts`) all trigger `openCard` on initial/target card entry and `closeCard` before leaving a card.
5. **Testing Discipline**:
   - Clean-clone safe: `predev`, `pretypecheck`, `pretest`, `pretest:unit`, `pretest:integration` all auto-run `npm run build:player`.
   - Every engine change must pass `npm run test:unit` (Vitest).
   - Every UI flow must pass `npm run test:integration` (Testing Library).
   - Release verification must pass `npm run test:e2e` (Playwright), including opening an exported single-file `.html` offline and toggling themes.
