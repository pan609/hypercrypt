# Final-check fixes — 2026-11-26

This records the developer's response to the independent final check on `d28f28b`. The judge signed lightweight acceptance PASS in section 8 of the workspace final-check report. This file records the developer evidence and does not replace that independent decision.

- **P1 loop budget**: a shared `consumeStep()` charges statements and every iteration of `repeat times`, `repeat with` and `repeat while`. Empty bodies and non-advancing floating-point counters exhaust the same 10,000-step budget.
- **P2 first-card initialization**: every new Markdown compilation initializes its first card once, including under StrictMode. Theme rerenders do not reinitialize it. The six-layer guard remains in place.
- **Review follow-up**: recompilation cancels old timers and pending dialogs, rejects stale runs, and isolates lifecycle depth by revision. Tests cover stale writes and eight successive abandoned ask/answer initializers.

## Validation

| Check | Result |
| --- | --- |
| `npm run build` (player, TypeScript, Web, MCP) | exit 0 |
| `npm test` | 36/36 passed, including all 26 previous tests |
| `npm run validate:presets` | all 10 passed |
| Chromium E2E | 4/4 passed, including both existing tests |
| Actual downloaded offline HTML | RPG ending/respawn, theme, Markdown first-card initialization and controlled finite empty-loop error verified |
| `python3 scripts/verify-sandbox-artifacts.py` | 12/12 isolated source/built-MCP probes passed |
| Independent review | Round 1: one valid cancellation finding, fixed; Round 2: no findings; outcomes recorded |

Every potentially unbounded numeric case runs in a disposable OS process. Unit-test children have a 3-second external kill timeout; built-MCP probes run in new process groups with a 5-second external timeout that kills the complete group on regression. No precision-boundary infinite-loop probes are sent to a public page or persistent MCP server. Browser checks use a finite 20,001-iteration script.

The ordinary finite-script regression preserves descending counters, while loops, and `exit repeat`; a three-iteration empty loop now consumes iterations as intended.

Machine evidence and independent review outputs are under [evidence/final-fixes](evidence/final-fixes/). The [production receipt](evidence/final-fixes/production-receipt.json) confirms the public asset matches the tested build.

## Submission boundary

Use the official five dimensions, each weighted 20%: Potential Impact, Technological Implementation, Design, Innovation/Idea, and Presentation. Do not reuse the old three-dimension score or unsupported win probabilities. Final public YouTube video and actual Devpost submission remain separate deliverables; a script, local rough cut, or Kiro validation log is not a published final video.
