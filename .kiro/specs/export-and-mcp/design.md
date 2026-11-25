# Design — `export-and-mcp`

## Single-File HTML Bundler (`src/engine/htmlExporter.ts`)
- Generates a crisp, self-contained HTML5 string (`exportStackToHtml(stack, activeTheme)`):
  - Embeds stack payload inside `<script id="hc-stack-data" type="application/json">...</script>` with `<` replaced by `\u003c`.
  - Embeds a compact, clean, zero-dependency browser JS runtime implementing the exact same HyperTalk v1.0 Lexer/Parser/Interpreter (either compiled standalone IIFE bundle imported via Vite `?raw` during build OR clean shared ES/IIFE runtime string tested directly in Playwright!).
  - **Key Architectural Win**: By bundling `src/engine/standalonePlayer.ts` into a minified self-contained IIFE via a fast `build:player` step (esbuild, ~15–20 KB!), the exported `.html` uses the **EXACT SAME TypeScript HyperTalk Lexer, Parser, Interpreter, and Bitmap RLE decoder**—zero duplicated language logic, 100% behavioral parity!

## Markdown-to-Stack Compiler (`src/engine/markdownCompiler.ts`)
- Parses Markdown sections cleanly:
  - `# Stack Title` (optional top heading)
  - `## Card: <Card Name>` (or any `## <Card Name>`) starts a new Card
  - Regular paragraphs / bullet items become the card's primary readable text Field (auto-sized inside 512×342)
  - Action links formatted as `- [Button Label -> Target Card Name]` or `[Button Label -> Target Card Name]` become classic RoundRect Buttons arranged cleanly along the bottom of the card with generated HyperTalk:
    ```hypertalk
    on mouseUp
      play "click"
      visual effect dissolve
      go to card "Target Card Name"
    end mouseUp
    ```
  - Optional fenced ```` ```hypertalk ```` blocks inside a card section attach directly to the card's `script`!

## MCP Server (`mcp/server.ts`)
- Uses `@modelcontextprotocol/sdk/server/mcp.js` + `StdioServerTransport` + `zod` schemas.
- Built into `dist-mcp/server.js` via `esbuild` (`npm run build:mcp`) so `.kiro/settings/mcp.json` launches it instantaneously via `node dist-mcp/server.js` with zero `tsx` startup lag.
