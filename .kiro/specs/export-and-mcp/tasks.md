# Tasks — `export-and-mcp`

- [x] 1. Implement Markdown-to-Stack compiler (`src/engine/markdownCompiler.ts`) with auto-layout and generated HyperTalk navigation
- [x] 2. Implement URL Hash share codec (`src/engine/urlShare.ts`) and `.hcstack.json` import/export helpers
- [x] 3. Implement standalone browser player entry (`src/engine/standalonePlayer.ts`) + esbuild single-file IIFE build (`npm run build:player`) + HTML exporter (`src/engine/htmlExporter.ts`)
- [x] 4. Implement `hypercrypt-mcp` stdio server (`mcp/server.ts`) exposing all 4 tools + `npm run build:mcp`
- [x] 5. Add preset static validation CLI script (`scripts/validate-presets.ts` wired to `npm run validate:presets` for Kiro hooks)
- [x] 6. Write unit tests (`tests/unit/export-and-mcp.test.ts`) for Markdown compiler, HTML XSS escaping, URL codec, and MCP server tool calls
- [x] 7. Write Playwright E2E suite (`tests/e2e/hypercrypt.spec.ts`) covering full studio journeys + offline verification of the downloaded single-file `.html`
