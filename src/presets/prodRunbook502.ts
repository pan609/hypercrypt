import { compileMarkdownToStack } from '../engine/markdownCompiler';
import type { Stack } from '../engine/types';

export const PROD_502_RUNBOOK_MD = `# Prod 502 Triage Runbook

## Card: 502 Alert Received
PRODUCTION ALERT: Edge gateway returning HTTP 502 Bad Gateway (>2% error rate).

This interactive SRE decision deck was compiled directly from Markdown via HyperCrypt's \`compile_markdown_to_stack\` engine (also exposed as a Kiro MCP tool!).

Step 1 — Check your CDN / Edge dashboard first:
• Are 502s isolated to a single region, or global?
• Did a deployment land within the last 15 minutes?

> Note: Incident ID / On-call notes (editable live)...

- [Recent Deploy (<15m) -> Check Rollback]
- [No Recent Deploy -> Inspect Upstream]

## Card: Check Rollback
RECENT DEPLOYMENT DETECTED

1. Verify canary error logs in CloudWatch / Sentry for uncaught boot exceptions or missing env vars.
2. Check if health check \`/healthz\` is returning non-200 or timing out at 5s.
3. If error rate stays >1% after 2 minutes, trigger immediate rollback—do not debug forward during an outage!

> Note: Record commit SHA & rollback timestamp...

- [Trigger Rollback -> Rollback Verified]
- [Healthz OK -> Inspect Upstream]
- [← Back -> 502 Alert Received]

## Card: Inspect Upstream
UPSTREAM ORIGIN TRIAGE

1. Check origin CPU, memory, and connection pool saturation (PostgreSQL / Redis).
2. Confirm TLS certificate expiry and keep-alive timeout alignment (origin keep-alive must exceed ALB idle timeout!).
3. Check for sudden traffic spike or runaway retry storm.

> Note: Observed p99 latency & pool saturation...

- [Mitigation Applied -> Postmortem Ready]
- [Need Rollback -> Check Rollback]
- [← Back -> 502 Alert Received]

## Card: Rollback Verified
ROLLBACK COMPLETE — VERIFY RECOVERY

Checklist:
[1] Edge 502 rate dropped below 0.05% for 5 consecutive minutes.
[2] Synthetic checkout / login probes passing green.
[3] Status page updated to "Monitoring".

Export this card stack as a single offline .html file to archive your incident playbook with zero cloud dependencies!

- [Generate Postmortem -> Postmortem Ready]
- [← Start Over -> 502 Alert Received]

## Card: Postmortem Ready
INCIDENT RESOLVED · POSTMORTEM TEMPLATE

Capture while fresh:
• Customer impact duration & affected endpoints
• Root cause & contributing triggers
• 2 concrete preventative actions (with owners & due dates)

Tip: Edit your team's Markdown runbooks in Kiro IDE and call the \`compile_markdown_to_stack\` MCP tool to regenerate this interactive deck anytime!

\`\`\`hypertalk
on openCard
  play "chime"
end openCard
\`\`\`

- [↺ Restart Runbook -> 502 Alert Received]
`;

export function createProdRunbookStack(): Stack {
  const stack = compileMarkdownToStack(PROD_502_RUNBOOK_MD, {
    id: 'prod-502-runbook',
    title: 'Prod 502 Triage Runbook',
    author: 'Compiled via hypercrypt-mcp',
    defaultTheme: 'classic',
  });
  stack.description =
    'Practical 5-card SRE incident response decision deck compiled straight from Markdown using our Kiro MCP compiler.';
  return stack;
}
