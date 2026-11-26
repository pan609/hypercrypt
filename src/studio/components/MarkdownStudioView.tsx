import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, ExternalLink, Sparkles } from 'lucide-react';
import { HyperTalkInterpreter } from '../../engine/interpreter';
import { compileMarkdownToStack } from '../../engine/markdownCompiler';
import { analyzeStackGraph } from '../../engine/stackGraph';
import { highlightHyperTalkLine } from '../../engine/syntaxHighlight';
import type { RuntimeHost, Stack, VisualEffect } from '../../engine/types';
import { validateStack } from '../../engine/validator';
import { PROD_502_RUNBOOK_MD, PROD_502_RUNBOOK_MD_ZH } from '../../presets/prodRunbook502';
import { playRetroSound } from '../audio/retroAudio';
import type { Locale } from '../i18n/messages';
import { useStudio } from '../store/useStudioStore';

const MYSTERY_MD: Record<Locale, string> = {
  en: `# Starlight Express 1987

## Card: Platform 9
Midnight snow falls gently across the 1987 vintage train station. A brass pocket watch glows on the bench.

> Note: Detective clues (editable live)...

- [Board Dining Car -> Dining Car]
- [Inspect Engine -> Steam Engine]

## Card: Dining Car
Warm amber lamps sway above velvet booths. On table 4 sits a coded floppy disk labeled "KIRO-87".

- [Decode Floppy -> Final Reveal]
- [← Back to Platform -> Platform 9]

## Card: Steam Engine
The engineer smiles and hands you a brass key stamped with a pixel ghost!

- [Unlock Dining Safe -> Final Reveal]
- [← Back to Platform -> Platform 9]

## Card: Final Reveal
MYSTERY SOLVED! The floppy contains the lost blueprint of HyperCard 2026.

\`\`\`hypertalk
on openCard
  play "chime"
end openCard
\`\`\`

- [↺ Play Again -> Platform 9]
`,
  zh: `# 星夜特快 1987（互动推理）

## Card: 9 号站台
午夜细雪飘落在 1987 年复古火车站台，长椅上一块黄铜怀表正微微发光。

> Note: 在此记录侦探线索（实时可编辑）...

- [登上餐车 -> 复古餐车]
- [查看蒸汽机车 -> 机车驾驶室]

## Card: 复古餐车
暖黄色台灯在丝绒卡座上方摇曳。4 号桌上放着一张贴着「KIRO-87」标签的神秘软盘。

- [破译软盘密码 -> 真相揭晓]
- [← 返回站台 -> 9 号站台]

## Card: 机车驾驶室
老司机微笑着递给你一把刻着像素小幽灵的黄铜钥匙！

- [打开餐车保险箱 -> 真相揭晓]
- [← 返回站台 -> 9 号站台]

## Card: 真相揭晓
推理成功！软盘里封存的正是 2026 年复活的 HyperCard 终极蓝图。

\`\`\`hypertalk
on openCard
  play "chime"
end openCard
\`\`\`

- [↺ 重新开始推理 -> 9 号站台]
`,
};

const ONBOARDING_MD: Record<Locale, string> = {
  en: `# Engineer Day-1 Onboarding

## Card: Welcome Aboard!
Welcome to the team! This interactive offline deck walks you through your first day in 3 quick steps.

> Note: Your name & buddy handle...

- [Step 1: Local Dev -> Dev Setup]
- [Step 2: First PR -> Shipping First PR]

## Card: Dev Setup
1. Clone the repository and run \`npm install\`.
2. Open the folder in Kiro IDE to activate \`.kiro/steering\` & hooks.
3. Run \`npm test\` to confirm green unit + integration checks.

- [Next: First PR -> Shipping First PR]
- [← Home -> Welcome Aboard!]

## Card: Shipping First PR
1. Create a feature branch from \`main\`.
2. Let Kiro Hooks auto-validate specs and tests on save.
3. Open your PR and tag your onboarding buddy!

- [↺ Back to Start -> Welcome Aboard!]
`,
  zh: `# 新员工 Day-1 入职交互手册

## Card: 欢迎加入团队！
欢迎加入！这份可离线运行的互动卡片栈将在 3 步内带你完成首日环境配置。

> Note: 记录你的花名与导师联系方式...

- [第 1 步：开发环境 -> 本地环境配置]
- [第 2 步：首个 PR -> 提交第一个 PR]

## Card: 本地环境配置
1. 克隆仓库并执行 \`npm install\`。
2. 用 Kiro IDE 打开项目，自动激活 \`.kiro/steering\` 与保存钩子。
3. 运行 \`npm test\` 确认全部单元测试通过。

- [下一步：提交 PR -> 提交第一个 PR]
- [← 返回首页 -> 欢迎加入团队！]

## Card: 提交第一个 PR
1. 从 \`main\` 拉出你的特性分支。
2. 保存文件时由 Kiro Hook 自动校验规范与单测。
3. 提交 PR 并 @ 你的导师进行 Review！

- [↺ 回到首页 -> 欢迎加入团队！]
`,
};

function getTemplateMarkdown(key: 'runbook' | 'mystery' | 'onboarding', loc: Locale): string {
  if (key === 'runbook') return loc === 'zh' ? PROD_502_RUNBOOK_MD_ZH : PROD_502_RUNBOOK_MD;
  if (key === 'mystery') return MYSTERY_MD[loc];
  return ONBOARDING_MD[loc];
}

type PreviewModal =
  | { kind: 'answer'; prompt: string; buttons: string[]; resolve: (v: string) => void }
  | { kind: 'ask'; prompt: string; defaultValue: string; resolve: (v: string | null) => void };

export function MarkdownStudioView() {
  const { locale, theme, muted, t, loadCustomStack, exportHtmlFile } = useStudio();
  const [templateKey, setTemplateKey] = useState<'runbook' | 'mystery' | 'onboarding'>('runbook');
  const [userEdited, setUserEdited] = useState(false);
  const [markdown, setMarkdown] = useState(() => getTemplateMarkdown('runbook', locale));
  const [rightTab, setRightTab] = useState<'preview' | 'code' | 'audit'>('preview');

  const compiled = useMemo(() => compileMarkdownToStack(markdown), [markdown]);
  const issues = useMemo(() => validateStack(compiled), [compiled]);
  const graph = useMemo(() => analyzeStackGraph(compiled), [compiled]);

  // Live sandboxed runtime state for the right-hand preview pane (real HyperTalkInterpreter!)
  const [previewStack, setPreviewStack] = useState<Stack>(() => JSON.parse(JSON.stringify(compiled)));
  const [previewCardIdx, setPreviewCardIdx] = useState(0);
  const [previewFx, setPreviewFx] = useState<VisualEffect>('none');
  const [previewFxNonce, setPreviewFxNonce] = useState(0);
  const [previewModal, setPreviewModal] = useState<PreviewModal | null>(null);
  const [previewAskDraft, setPreviewAskDraft] = useState('');
  const [previewLastRun, setPreviewLastRun] = useState<string | null>(null);

  const stackRef = useRef(previewStack);
  stackRef.current = previewStack;
  const idxRef = useRef(previewCardIdx);
  idxRef.current = previewCardIdx;
  const globalsRef = useRef<Record<string, string>>({});

  // Sync template when locale changes (only if user hasn't manually edited source)
  useEffect(() => {
    if (!userEdited) {
      setMarkdown(getTemplateMarkdown(templateKey, locale));
    }
  }, [locale, templateKey, userEdited]);

  // Reset live preview runtime whenever compiled stack changes
  useEffect(() => {
    const fresh: Stack = JSON.parse(JSON.stringify(compiled));
    stackRef.current = fresh;
    idxRef.current = 0;
    globalsRef.current = {};
    setPreviewStack(fresh);
    setPreviewCardIdx(0);
    setPreviewModal(null);
    setPreviewLastRun(null);
  }, [compiled]);

  useEffect(() => {
    if (previewModal?.kind === 'ask') setPreviewAskDraft(previewModal.defaultValue);
  }, [previewModal]);

  const mutatePreview = useCallback((fn: (s: Stack) => void) => {
    const next: Stack = JSON.parse(JSON.stringify(stackRef.current));
    fn(next);
    stackRef.current = next;
    setPreviewStack(next);
  }, []);

  const runPreviewLifecycleRef = useRef<(h: 'openCard' | 'closeCard') => Promise<void>>(async () => {});

  const createPreviewHost = useCallback((): RuntimeHost => {
    return {
      getCurrentCardIndex: () => idxRef.current,
      getCardCount: () => stackRef.current.cards.length,
      getCurrentCardName: () => stackRef.current.cards[idxRef.current]?.name ?? '',
      findCardIndexByName: (name) =>
        stackRef.current.cards.findIndex((c) => c.name.trim().toLowerCase() === name.trim().toLowerCase()),
      goToCard: async (nextIdx, effect) => {
        const clamped = Math.max(0, Math.min(stackRef.current.cards.length - 1, nextIdx));
        if (clamped !== idxRef.current) {
          await runPreviewLifecycleRef.current('closeCard');
        }
        idxRef.current = clamped;
        setPreviewCardIdx(clamped);
        setPreviewFx(effect);
        setPreviewFxNonce((n) => n + 1);
        await runPreviewLifecycleRef.current('openCard');
      },
      getFieldText: (name) => {
        const f = stackRef.current.cards[idxRef.current]?.objects.find(
          (o) => o.type === 'field' && o.name.trim().toLowerCase() === name.trim().toLowerCase(),
        );
        return f && f.type === 'field' ? f.text : '';
      },
      setFieldText: (name, text) => {
        mutatePreview((s) => {
          const f = s.cards[idxRef.current]?.objects.find(
            (o) => o.type === 'field' && o.name.trim().toLowerCase() === name.trim().toLowerCase(),
          );
          if (f && f.type === 'field') f.text = text;
        });
      },
      getButtonLabel: (name) => {
        const b = stackRef.current.cards[idxRef.current]?.objects.find(
          (o) => o.type === 'button' && o.name.trim().toLowerCase() === name.trim().toLowerCase(),
        );
        return b && b.type === 'button' ? b.label : '';
      },
      setButtonLabel: (name, label) => {
        mutatePreview((s) => {
          const b = s.cards[idxRef.current]?.objects.find(
            (o) => o.type === 'button' && o.name.trim().toLowerCase() === name.trim().toLowerCase(),
          );
          if (b && b.type === 'button') b.label = label;
        });
      },
      getButtonChecked: (name) => {
        const b = stackRef.current.cards[idxRef.current]?.objects.find(
          (o) => o.type === 'button' && o.name.trim().toLowerCase() === name.trim().toLowerCase(),
        );
        return b && b.type === 'button' ? Boolean(b.checked) : false;
      },
      setButtonChecked: (name, checked) => {
        mutatePreview((s) => {
          const b = s.cards[idxRef.current]?.objects.find(
            (o) => o.type === 'button' && o.name.trim().toLowerCase() === name.trim().toLowerCase(),
          );
          if (b && b.type === 'button') b.checked = checked;
        });
      },
      setObjectVisible: (kind, name, visible) => {
        mutatePreview((s) => {
          const o = s.cards[idxRef.current]?.objects.find(
            (obj) => obj.type === kind && obj.name.trim().toLowerCase() === name.trim().toLowerCase(),
          );
          if (o) o.visible = visible;
        });
      },
      answer: (prompt, buttons) =>
        new Promise((resolve) => {
          setPreviewModal({
            kind: 'answer',
            prompt,
            buttons,
            resolve: (choice) => {
              setPreviewModal(null);
              resolve(choice);
            },
          });
        }),
      ask: (prompt, defaultValue) =>
        new Promise((resolve) => {
          setPreviewModal({
            kind: 'ask',
            prompt,
            defaultValue,
            resolve: (val) => {
              setPreviewModal(null);
              resolve(val);
            },
          });
        }),
      play: (sound) => playRetroSound(sound, theme, muted),
      wait: (ms) => new Promise((r) => window.setTimeout(r, ms)),
    };
  }, [mutatePreview, muted, theme]);

  const runPreviewLifecycle = useCallback(
    async (handler: 'openCard' | 'closeCard') => {
      const card = stackRef.current.cards[idxRef.current];
      if (!card || (!card.script.trim() && !stackRef.current.script.trim())) return;
      try {
        const interp = new HyperTalkInterpreter(createPreviewHost(), globalsRef.current);
        const res = await interp.runHandler([card.script, stackRef.current.script], handler);
        globalsRef.current = { ...globalsRef.current, ...res.globals };
      } catch (err) {
        setPreviewLastRun(`Error: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
    [createPreviewHost],
  );
  runPreviewLifecycleRef.current = runPreviewLifecycle;

  const handlePreviewButtonClick = async (objId: string) => {
    const card = stackRef.current.cards[idxRef.current];
    const obj = card?.objects.find((o) => o.id === objId);
    if (!card || !obj) return;
    try {
      const interp = new HyperTalkInterpreter(createPreviewHost(), globalsRef.current);
      const res = await interp.runHandler([obj.script, card.script, stackRef.current.script], 'mouseUp');
      globalsRef.current = { ...globalsRef.current, ...res.globals };
      setPreviewLastRun(`${obj.name} · ${res.stepsExecuted} AST ops`);
    } catch (err) {
      setPreviewLastRun(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const applyTemplate = (key: 'runbook' | 'mystery' | 'onboarding') => {
    setTemplateKey(key);
    setUserEdited(false);
    setMarkdown(getTemplateMarkdown(key, locale));
  };

  const safeCardIdx = Math.min(previewCardIdx, Math.max(0, previewStack.cards.length - 1));
  const previewCard = previewStack.cards[safeCardIdx];
  const fxClass = previewFx !== 'none' ? `fx-${previewFx.replace(/\s+/g, '-')}` : '';

  return (
    <main className="hc-md-layout" data-testid="md-studio-view">
      {/* Top Toolbar */}
      <div className="hc-md-toolbar">
        <div>
          <strong style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={14} /> {t.mdTitle}
          </strong>
          <div style={{ fontSize: 10.5, color: 'var(--hc-ink-muted)' }}>{t.mdSubtitle}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span className="hc-section-label">{t.mdTemplates}:</span>
          <button
            type="button"
            className={`hc-btn ${templateKey === 'runbook' ? 'primary' : ''}`}
            onClick={() => applyTemplate('runbook')}
          >
            {t.mdTplRunbook}
          </button>
          <button
            type="button"
            className={`hc-btn ${templateKey === 'mystery' ? 'primary' : ''}`}
            onClick={() => applyTemplate('mystery')}
          >
            {t.mdTplMystery}
          </button>
          <button
            type="button"
            className={`hc-btn ${templateKey === 'onboarding' ? 'primary' : ''}`}
            onClick={() => applyTemplate('onboarding')}
          >
            {t.mdTplOnboarding}
          </button>

          <div className="hc-dropdown-divider" style={{ width: 1, height: 18, margin: '0 4px' }} />

          <button
            type="button"
            className="hc-btn primary"
            data-testid="md-open-studio"
            onClick={() => loadCustomStack(compiled, 'browse')}
          >
            <ExternalLink size={12} /> {t.mdOpenStudio}
          </button>
          <button type="button" className="hc-btn" onClick={() => exportHtmlFile(compiled)}>
            <Download size={12} /> {t.mdExportHtml}
          </button>
        </div>
      </div>

      {/* Split Screen: Markdown Input | Live Compiled Preview + HyperTalk + Audit */}
      <div className="hc-md-split">
        <div className="hc-md-pane">
          <div className="hc-md-pane-head">
            <span>Markdown Source</span>
            <span style={{ color: 'var(--hc-ink-muted)', fontSize: 10 }}>
              ## Card: Name · - [Button -&gt; Target] · &gt; Note: ...
            </span>
          </div>
          <textarea
            aria-label="Markdown compiler source"
            data-testid="md-source-input"
            className="hc-md-textarea"
            spellCheck={false}
            value={markdown}
            onChange={(e) => {
              setUserEdited(true);
              setMarkdown(e.target.value);
            }}
          />
        </div>

        <div className="hc-md-pane">
          <div className="hc-tabs">
            <button
              type="button"
              className={`hc-tab ${rightTab === 'preview' ? 'active' : ''}`}
              onClick={() => setRightTab('preview')}
            >
              {t.mdTabPreview} ({previewStack.cards.length})
            </button>
            <button
              type="button"
              className={`hc-tab ${rightTab === 'code' ? 'active' : ''}`}
              onClick={() => setRightTab('code')}
            >
              {t.mdTabCode}
            </button>
            <button
              type="button"
              className={`hc-tab ${rightTab === 'audit' ? 'active' : ''}`}
              onClick={() => setRightTab('audit')}
            >
              {t.mdTabAudit} ({issues.length})
            </button>
          </div>

          <div className="hc-md-right-body">
            {rightTab === 'preview' && previewCard && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
                <div className="hc-window" style={{ maxWidth: 540, position: 'relative' }}>
                  <div className="hc-titlebar">
                    <div className="hc-close-box" />
                    <div className="hc-stripes" />
                    <span data-testid="md-preview-title">
                      {previewStack.title} — {previewCard.name} ({safeCardIdx + 1}/{previewStack.cards.length})
                    </span>
                    <div className="hc-stripes" />
                  </div>
                  <div
                    key={`${previewCard.id}-${previewFxNonce}`}
                    className={fxClass}
                    style={{
                      padding: 14,
                      background: 'var(--hc-card-bg)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                      position: 'relative',
                    }}
                  >
                    {previewCard.objects
                      .filter((o) => o.type === 'field' && o.visible)
                      .map((f) =>
                        f.type === 'field' ? (
                          f.locked ? (
                            <div
                              key={f.id}
                              className={`hc-card-field style-${f.style}`}
                              style={{
                                position: 'static',
                                height: 'auto',
                                fontSize: f.fontSize ?? 12,
                              }}
                            >
                              {f.text}
                            </div>
                          ) : (
                            <textarea
                              key={f.id}
                              className={`hc-card-field editable style-${f.style}`}
                              style={{
                                position: 'static',
                                minHeight: 54,
                                fontSize: f.fontSize ?? 11.5,
                              }}
                              value={f.text}
                              onChange={(e) =>
                                mutatePreview((s) => {
                                  const target = s.cards[safeCardIdx]?.objects.find((o) => o.id === f.id);
                                  if (target && target.type === 'field') target.text = e.target.value;
                                })
                              }
                            />
                          )
                        ) : null,
                      )}

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                      {previewCard.objects
                        .filter((o) => o.type === 'button' && o.visible)
                        .map((b) =>
                          b.type === 'button' ? (
                            <button
                              key={b.id}
                              type="button"
                              className={`hc-btn ${b.accent ? 'primary' : ''}`}
                              style={{ flex: '1 1 30%', justifyContent: 'center' }}
                              onClick={() => void handlePreviewButtonClick(b.id)}
                            >
                              {b.label}
                            </button>
                          ) : null,
                        )}
                    </div>

                    {previewModal && (
                      <div className="hc-modal-backdrop" role="dialog" aria-modal="true">
                        <div className="hc-modal">
                          <p style={{ margin: '0 0 12px', fontSize: 12, whiteSpace: 'pre-wrap' }}>
                            {previewModal.prompt}
                          </p>
                          {previewModal.kind === 'ask' && (
                            <input
                              autoFocus
                              className="hc-input"
                              style={{ width: '100%', marginBottom: 10 }}
                              value={previewAskDraft}
                              onChange={(e) => setPreviewAskDraft(e.target.value)}
                            />
                          )}
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                            {previewModal.kind === 'answer' ? (
                              previewModal.buttons.map((lbl, idx) => (
                                <button
                                  key={lbl}
                                  type="button"
                                  className={`hc-btn ${idx === 0 ? 'primary' : ''}`}
                                  onClick={() => previewModal.resolve(lbl)}
                                >
                                  {lbl}
                                </button>
                              ))
                            ) : (
                              <>
                                <button type="button" className="hc-btn" onClick={() => previewModal.resolve(null)}>
                                  {t.cancel}
                                </button>
                                <button
                                  type="button"
                                  className="hc-btn primary"
                                  onClick={() => previewModal.resolve(previewAskDraft)}
                                >
                                  {t.ok}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {previewLastRun && (
                  <div style={{ fontSize: 10.5, color: 'var(--hc-ink-muted)' }}>
                    HyperTalk VM: <strong>{previewLastRun}</strong>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {previewStack.cards.map((c, idx) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`hc-btn ${idx === safeCardIdx ? 'primary' : ''}`}
                      style={{ fontSize: 10.5 }}
                      onClick={() => {
                        idxRef.current = idx;
                        setPreviewCardIdx(idx);
                        void runPreviewLifecycle('openCard');
                      }}
                    >
                      {idx + 1}. {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {rightTab === 'code' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {compiled.cards.map((card, cIdx) => (
                  <div key={card.id} className="hc-panel-box">
                    <div className="hc-section-label">
                      Card {cIdx + 1}: {card.name}
                    </div>
                    {card.script.trim() && (
                      <div style={{ marginTop: 4 }}>
                        <div style={{ fontSize: 10.5, fontWeight: 700, marginBottom: 3 }}>
                          card &quot;{card.name}&quot;
                        </div>
                        <pre className="hc-readonly-code">
                          {card.script.split('\n').map((line, lIdx) => (
                            <div key={lIdx}>
                              {highlightHyperTalkLine(line).map((sp, sIdx) => (
                                <span key={sIdx} className={`ht-tok-${sp.type}`}>
                                  {sp.text}
                                </span>
                              ))}
                            </div>
                          ))}
                        </pre>
                      </div>
                    )}
                    {card.objects
                      .filter((o) => o.script.trim().length > 0)
                      .map((obj) => (
                        <div key={obj.id} style={{ marginTop: 4 }}>
                          <div style={{ fontSize: 10.5, fontWeight: 700, marginBottom: 3 }}>
                            {obj.type} &quot;{obj.name}&quot;
                          </div>
                          <pre className="hc-readonly-code">
                            {obj.script.split('\n').map((line, lIdx) => (
                              <div key={lIdx}>
                                {highlightHyperTalkLine(line).map((sp, sIdx) => (
                                  <span key={sIdx} className={`ht-tok-${sp.type}`}>
                                    {sp.text}
                                  </span>
                                ))}
                              </div>
                            ))}
                          </pre>
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            )}

            {rightTab === 'audit' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="hc-panel-box">
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontWeight: 700,
                      color: issues.length === 0 ? 'var(--hc-success)' : 'var(--hc-danger)',
                    }}
                  >
                    {issues.length === 0 ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                    {issues.length === 0 ? t.mdAuditClean : `${issues.length} validation issue(s) found`}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--hc-ink-muted)' }}>
                    {t.mapCards}: {graph.nodes.length} · {t.mapLinks}: {graph.edges.length} · {t.mapScripts}:{' '}
                    {graph.totalScripts}
                  </div>
                </div>

                {issues.map((issue, i) => (
                  <div
                    key={i}
                    className="hc-panel-box"
                    style={{ borderColor: 'var(--hc-danger)', color: 'var(--hc-danger)' }}
                  >
                    <strong>
                      [{issue.severity}] {issue.location}
                    </strong>
                    <span>{issue.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
