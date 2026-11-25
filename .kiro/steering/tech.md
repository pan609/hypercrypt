---
inclusion: always
---

# HyperCrypt — Technology & Quality Steering

## Stack
- **Frontend**: Vite + React 19 + TypeScript (strict mode) + CSS custom properties (`data-hc-theme="classic" | "kiroween"`)
- **Engine (`src/engine/`)**: Pure zero-dependency TypeScript shared across the browser Studio, exported standalone HTML player, Vitest suite, and Node MCP server (`mcp/server.ts`).
- **Audio**: Procedural Web Audio API synthesizer (`src/studio/audio/retroAudio.ts`)—no copyrighted external audio assets.
- **MCP Server (`mcp/server.ts`)**: Official `@modelcontextprotocol/sdk` over stdio transport, compiled to `dist-mcp/server.js` for zero-friction Kiro execution.
- **Deployment**: Static SPA on Vercel (`npm run build` → `dist/`). Zero backend servers, zero runtime environment secrets required.

## Hard Engineering Guardrails
1. **Never use `eval`, `new Function`, or raw `innerHTML` with user/stack strings.** All HyperTalk runs exclusively through our custom AST interpreter (`src/engine/interpreter.ts`).
2. **Strict Sandbox Limits**: Every script invocation enforces `maxSteps = 10_000` and `maxCallDepth = 32` to guarantee immunity against infinite loops.
3. **Engine Purity**: Files inside `src/engine/` MUST NOT import `react`, `react-dom`, or reference `window` / `document` directly.
4. **Testing Discipline**:
   - Every engine change must pass `npm run test:unit` (Vitest).
   - Every UI flow must pass `npm run test:integration` (Testing Library).
   - Release verification must pass `npm run test:e2e` (Playwright), including opening an exported single-file `.html` offline.
