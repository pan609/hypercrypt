# Design — `export-and-mcp`

## Single-File HTML Bundler (`src/engine/htmlExporter.ts` + `src/player/standalonePlayer.ts`)
- Generates a crisp, self-contained HTML5 string (`exportStackToHtml(stack, playerBundleJs, activeTheme)`):
  - Embeds stack payload inside `<script id="hc-stack-data" type="application/json">...</script>` with `<`, `>`, `&`, and line separators safely escaped.
  - Keeps browser DOM / Canvas / singleton `AudioContext` code cleanly isolated in `src/player/standalonePlayer.ts` (preserving `src/engine/` 100% zero-DOM purity).
  - Bundles `src/player/standalonePlayer.ts` into a minified ~34 KB IIFE (`src/player/generated/standalonePlayer.bundle.txt`) via `npm run build:player`, auto-triggered by `predev`, `pretypecheck`, `pretest`, `pretest:unit`, `pretest:integration`, and `prepreview`.
  - Applies `data-hc-theme` to both `document.documentElement` and `#hc-standalone-root` so outer desktop and inner card re-color in lockstep, and runs `closeCard` / `openCard` lifecycle handlers identically to Studio.

## Markdown-to-Stack Compiler (`src/engine/markdownCompiler.ts`)
- Parses Markdown sections cleanly:
  - `# Stack Title` (optional top heading)
  - `## Card: <Card Name>` (or any `## <Card Name>`) starts a new Card
  - Regular paragraphs / bullet items become the card's primary readable text Field (auto-sized inside 512×342)
  - Action links formatted as `- [Button Label -> Target Card Name]` become classic RoundRect Buttons cleanly wrapped across rows of up to 3 buttons (supporting >3 buttons with zero silent dropping) with generated HyperTalk navigation scripts
  - Optional `> Note: ...` creates an editable live notes field; fenced ```` ```hypertalk ```` blocks attach directly to `card.script`.

## MCP Server (`mcp/server.ts`)
- Uses `@modelcontextprotocol/sdk/server/mcp.js` + `StdioServerTransport` + `zod` schemas.
- Bundled with all runtime dependencies into zero-install `dist-mcp/server.js` via `npm run build:mcp` and committed to git so `.kiro/settings/mcp.json` launches it instantaneously via `node dist-mcp/server.js` even on a clean clone.
