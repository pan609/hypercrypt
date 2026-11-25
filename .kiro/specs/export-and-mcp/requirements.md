# Requirements — `export-and-mcp`

## Overview
Enable true offline immortality via Single-File `.html` Export and URL Hash sharing, and bridge 1987 HyperCard with 2026 AI workflows through the `hypercrypt-mcp` Kiro MCP server.

## Requirements (EARS Notation)

### REQ-1: Immortal Single-File `.html` Export
- **REQ-1.1**: WHEN the user clicks **Export .html**, THE SYSTEM SHALL generate a single self-contained HTML document containing the serialized Stack JSON, an embedded standalone HyperTalk runtime, 1-bit bitmap renderer, visual transitions, dual-skin CSS, and Web Audio synth with ZERO external network/CDN requests.
- **REQ-1.2**: WHEN the exported `.html` file is opened offline in any modern browser, THE SYSTEM SHALL render Card 1 and execute all card buttons, `ask`/`answer` modals, `global` state, transitions, and sounds identically to Browse Mode.
- **REQ-1.3**: WHEN serializing Stack JSON into HTML, THE SYSTEM SHALL safely escape `<`, `>`, and `</script>` sequences to prevent XSS or malformed markup.

### REQ-2: URL Hash Share & `.hcstack.json` Import/Export
- **REQ-2.1**: WHEN the user clicks **Share Link**, THE SYSTEM SHALL encode the active Stack into `#stack=<payload>` and copy the full URL to clipboard (warning gracefully if payload exceeds safe URL size).
- **REQ-2.2**: WHEN the app opens with a valid `#stack=` hash, THE SYSTEM SHALL decode and load that shared stack automatically.
- **REQ-2.3**: WHEN the user exports or imports `.hcstack.json`, THE SYSTEM SHALL validate the file via `validateStack` and display clear feedback on invalid files.

### REQ-3: Custom Kiro MCP Server (`hypercrypt-mcp`)
- **REQ-3.1**: WHEN Kiro connects to `hypercrypt-mcp` via stdio (`.kiro/settings/mcp.json`), THE SERVER SHALL expose 4 typed tools:
  1. `validate_hypertalk({ script })` → returns `{ valid, handlers, diagnostics }`
  2. `run_hypertalk_script({ stackJson, cardIndex?, handler?, targetName?, inputs? })` → executes headlessly in the shared sandbox and returns `{ finalCardIndex, globals, fieldTexts, audioPlayed, dialogs, trace, error? }`
  3. `validate_stack({ stackJson })` → returns `{ valid, issueCount, issues }`
  4. `compile_markdown_to_stack({ markdown, title?, author?, defaultTheme? })` → compiles structured Markdown (`## Card: Name`, body, `- [Button -> Target Card]`, optional ```hypertalk blocks) into a validated `.hcstack.json` string.
