# R2 hotfix verification — 2026-11-26 (Asia/Shanghai)

The independent R2 decision permits release without R3 once nested lifecycle globals, Markdown lifecycle depth, regression assertions, rebuilt bundles, and the production deployment are complete. This file records implementation evidence; it does not replace the independent review.

- Every interpreter in a host session now shares the same mutable globals object. A button's writes are visible to `closeCard` and `openCard` immediately, and lifecycle writes remain visible when the outer button resumes. Returned globals remain display snapshots.
- Studio, the standalone HTML player, headless host, and Markdown preview no longer replace live globals with a returned snapshot. Markdown lifecycle nesting stops at depth 6.
- RPG HUD spacing is reduced in English and Chinese. Object prototype names remain ordinary script variables.
- `npm run build`: exit 0; rebuilds the standalone player, typechecks, builds the web app, and rebuilds `dist-mcp/server.js`.
- `npm run validate:presets`: exit 0 (all 10 English/Chinese stacks and templates).
- `npm test`: exit 0 (26 tests across 4 files). Includes ending-title and HP:10 respawn assertions, writes before/during/after nested lifecycle calls, and live stdio calls against the rebuilt MCP bundle.
- `npm run test:e2e`: exit 0 (2 Chromium tests). The new regression plays Ending Open Source, deterministically loses four dice duels, and respawns with HP:10/Gold:5 in both Studio and the actual downloaded HTML with external requests blocked.
- Environment: macOS, Node v22.23.4. No new production dependencies.

## Release receipt

Fix commit `7d969cf` was pushed to public `pan609/hypercrypt` and Vercel production was redeployed successfully (CLI exit 0). The public page returns HTTP 200; its `/assets/index-CB4OWVpb.js` has the same SHA-256 as the tested local build. See [machine-readable receipt](R2_PRODUCTION_RECEIPT.json). The R2 automatic upgrade conditions are satisfied: **PASS**, with the original 8.6/10 score unchanged.

## Evidence boundary

Kiro IDE 1.5.44 is installed. The user completed sign-in on 2026-11-26. We then verified all four MCP tools in that IDE, and a Kiro edit to `src/engine/types.ts` triggered the engine save Hook, recorded as completed. See [the live check](KIRO_LIVE_CHECK.md), [MCP inputs/results](evidence/kiro-mcp-live.json), and [Hook event](evidence/kiro-hook-live.json). The Hook event does not expose stdout or a numeric exit code; the full release tests above were verified separately.

The hook JSON shape matches the current [official Kiro Hooks schema](https://kiro.dev/docs/hooks/) (page updated 2026-11-15), and the IDE save trigger has now been observed.

Final edited footage, the YouTube URL, bonus article publication, and Devpost submission remain outstanding. Submission prose now describes the verified current Kiro workflow instead of asserting that all past implementation happened in Kiro.
