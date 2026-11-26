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

## Evidence boundary

Kiro IDE 1.5.44 is installed. Its native UI was checked on 2026-11-26 and is still at **Sign in**. The screen states that signing in agrees to the AWS Customer Agreement, Service Terms, and Privacy Notice. The user must complete that step before IDE hook/MCP execution can be recorded. Passing a stdio MCP test is not proof of Kiro IDE execution.

The hook JSON shape matches the current [official Kiro Hooks schema](https://kiro.dev/docs/hooks/) (page updated 2026-11-15); the actual IDE trigger remains pending verification.

Final Kiro footage, the final YouTube URL, bonus article publication, and Devpost submission remain outstanding. Submission prose describing past Kiro use is a draft and must be reconciled against real captured use before publication.
