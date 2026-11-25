import { compileMarkdownToStack } from '../engine/markdownCompiler';
import type { Stack } from '../engine/types';
import type { Locale } from '../studio/i18n/messages';

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

export const PROD_502_RUNBOOK_MD_ZH = `# 线上 502 故障排查手册

## Card: 收到 502 告警
生产告警：边缘网关返回 HTTP 502 Bad Gateway（错误率 > 2%）。

这份交互式 SRE 排查卡片栈由 HyperCrypt 的 Markdown 编译器直接编译生成（同样作为 Kiro MCP 工具开放！）。

第 1 步 — 先查看 CDN / 边缘网关监控面板：
• 502 是单地域局部异常，还是全网抖动？
• 最近 15 分钟内是否有新版本发布上线？

> Note: 在此记录故障单号与值班排查笔记（可直接编辑）...

- [15 分钟内有发布 -> 检查并回滚]
- [近期无发布 -> 排查上游源站]

## Card: 检查并回滚
检测到近期代码发布

1. 立即核查 CloudWatch / Sentry 金丝雀日志，确认是否存在启动崩溃或环境变量缺失。
2. 检查健康探针 \`/healthz\` 是否返回非 200 或超过 5 秒超时。
3. 若 2 分钟后错误率仍 > 1%，立刻执行回滚——故障期间切忌线上硬改！

> Note: 记录发布 Commit SHA 与回滚时间戳...

- [已触发回滚 -> 验证恢复]
- [健康检查正常 -> 排查上游源站]
- [← 返回 -> 收到 502 告警]

## Card: 排查上游源站
上游源站容量与连接池诊断

1. 检查源站 CPU、内存及数据库/Redis 连接池是否打满。
2. 核对 TLS 证书有效期及 Keep-Alive 超时配置（源站 Keep-Alive 必须大于网关空闲超时）。
3. 检查是否遭遇突发流量洪峰或下游重试风暴。

> Note: 记录观测到的 p99 延迟与连接池占用...

- [已缓解恢复 -> 复盘模板]
- [需要回滚 -> 检查并回滚]
- [← 返回 -> 收到 502 告警]

## Card: 验证恢复
回滚完成 — 恢复验收清单

核对项：
[1] 边缘 502 错误率连续 5 分钟低于 0.05%。
[2] 核心登录/支付拨测全绿通过。
[3] 状态页更新为「持续观察中」。

点击右上角「导出 → 导出单文件 .html」，即可把整套应急预案保存成永久离线可用的团队手册！

- [生成复盘模板 -> 复盘模板]
- [← 重新排查 -> 收到 502 告警]

## Card: 复盘模板
故障已解决 · 复盘要点记录

趁热记录：
• 用户受影响时长与核心受影响接口
• 根因与放大故障的触发条件
• 2 条可落地的预防改进项（明确负责人与截止日）

提示：在 Kiro IDE 里修改团队 Markdown 手册，直接调用 \`compile_markdown_to_stack\` MCP 工具即可一键重新编译！

\`\`\`hypertalk
on openCard
  play "chime"
end openCard
\`\`\`

- [↺ 重新开始排查 -> 收到 502 告警]
`;

export function createProdRunbookStack(locale: Locale = 'en'): Stack {
  if (locale === 'zh') {
    const stack = compileMarkdownToStack(PROD_502_RUNBOOK_MD_ZH, {
      id: 'prod-502-runbook',
      title: '线上 502 故障排查手册',
      author: '由 hypercrypt-mcp 编译',
      defaultTheme: 'classic',
    });
    stack.description = '由 Markdown 直接编译生成的 5 卡实战 SRE 线上故障排查交互决策树。';
    return stack;
  }

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
