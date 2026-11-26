# Tasks — `export-and-mcp`

- [x] 1. Implement Markdown-to-Stack compiler (`src/engine/markdownCompiler.ts`) with multi-row button auto-layout and generated HyperTalk navigation
- [x] 2. Implement URL Hash share codec (`src/engine/urlShare.ts`) and `.hcstack.json` import/export helpers
- [x] 3. Isolate standalone browser player in `src/player/standalonePlayer.ts` (singleton `AudioContext`, root theme sync, `closeCard`/`openCard` lifecycle) + `npm run build:player` + `pre*` clean-clone hooks + HTML exporter (`src/engine/htmlExporter.ts`)
- [x] 4. Implement `hypercrypt-mcp` stdio server (`mcp/server.ts`) exposing all 4 tools + zero-install `dist-mcp/server.js` bundle
- [x] 5. Add preset static validation CLI script (`scripts/validate-presets.ts` wired to `npm run validate:presets` for Kiro hooks)
- [x] 6. Write unit tests (`tests/unit/export-and-mcp.test.ts`, `tests/unit/engine.test.ts`) for Markdown compiler (>3 buttons), HTML XSS escaping, URL codec, lifecycle parity, and live stdio MCP server tool calls
- [x] 7. Write Playwright E2E suite (`tests/e2e/hypercrypt.spec.ts`) covering full 4-view studio journeys + offline standalone `.html` verification including dark theme toggle
