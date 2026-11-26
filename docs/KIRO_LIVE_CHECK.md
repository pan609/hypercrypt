# Kiro IDE live verification — 2026-11-26

Verified in the actual Kiro IDE 1.5.44 on macOS after the user signed in. This is a live validation session, not evidence that all earlier implementation happened in Kiro.

## Workspace setup

The initial workspace was in Restricted Mode. Only the HyperCrypt repository folder was trusted. After **Developer: Reload Window**, Kiro Settings displayed:

- Three Specs: `export-and-mcp`, `hypertalk-engine`, `stack-studio`.
- Four workspace Steering documents.
- Three enabled hook definitions across the two JSON files.
- **hypercrypt Connected (4 tools)**.

No global MCP configuration was changed. The request to read user-level MCP config was denied; the local server connected using the project configuration after reload.

## Actual MCP results

[Sanitized tool inputs and outputs](evidence/kiro-mcp-live.json) were extracted from this actual IDE session, excluding authentication data and reasoning.

| Tool | Observed result |
| --- | --- |
| `validate_hypertalk` | Truncated `end mouseU` input returned the expected diagnostic; corrected `end mouseUp` input returned `valid: true`, no diagnostics. |
| `compile_markdown_to_stack` | Compiled the two-card “Kiro Live Check” document, with 0 validation issues. |
| `validate_stack` | `valid: true`, `errorCount: 0`, `issueCount: 0`. |
| `run_hypertalk_script` | Clicked `Continue` on card 0; returned `finalCardName: Done`, `finalCardIndex: 1`, body “MCP worked.” and `audioPlayed: [click]`. |

Compilation and script execution were allowed once, without creating a new permanent allow rule.

## Actual save Hook

Kiro added one documentation comment before `RuntimeHost.onBeforeStep` in `src/engine/types.ts`; runtime behavior did not change. The UI displayed **1 hook triggered** and **Run Command Hook — HyperTalk Engine Auto-Test**. The [sanitized event](evidence/kiro-hook-live.json) records `status: completed` at `2026-11-26T06:35:43.963Z` for the `npm run test:unit` hook.

The stored hook event does not expose stdout or a numeric exit code. Do not describe it as a separately observed “21 tests passed” report. The complete 26-test suite and two browser E2E tests were independently verified for the release, as documented in [R2_VALIDATION.md](R2_VALIDATION.md).

## Final recording still required

The live checks above are complete; the final edited YouTube demo has not been recorded or uploaded. Use [DEMO_SCRIPT.md](DEMO_SCRIPT.md) for the <=3 minute cut. Show the actual connected server, compiled stack, `Done` execution result, and Hook event. Use the Kiro section to describe the workflow now demonstrated, without claiming that all historical development used Kiro.
