import { useMemo, useRef } from 'react';
import { highlightHyperTalkLine } from '../../engine/syntaxHighlight';
import type { HandlerNode, ProgramNode, StatementNode } from '../../engine/types';

interface HyperTalkEditorProps {
  value: string;
  onChange: (next: string) => void;
  pausedLine: number | null;
  placeholder?: string;
}

export function HyperTalkEditor({ value, onChange, pausedLine, placeholder }: HyperTalkEditorProps) {
  const preRef = useRef<HTMLPreElement | null>(null);
  const gutterRef = useRef<HTMLDivElement | null>(null);

  const lines = useMemo(() => (value ? value.split('\n') : ['']), [value]);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const top = e.currentTarget.scrollTop;
    const left = e.currentTarget.scrollLeft;
    if (preRef.current) {
      preRef.current.scrollTop = top;
      preRef.current.scrollLeft = left;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = top;
    }
  };

  return (
    <div className="hc-code-editor-wrap">
      <div className="hc-code-gutter" ref={gutterRef} aria-hidden="true">
        {lines.map((_, idx) => (
          <div key={idx} className={`hc-code-ln ${pausedLine === idx + 1 ? 'paused' : ''}`}>
            {idx + 1}
          </div>
        ))}
      </div>

      <div className="hc-code-surface">
        <pre className="hc-code-highlight" ref={preRef} aria-hidden="true">
          {lines.map((line, idx) => (
            <div key={idx} className={`hc-code-line ${pausedLine === idx + 1 ? 'paused' : ''}`}>
              {line.length === 0
                ? ' '
                : highlightHyperTalkLine(line).map((span, sIdx) => (
                    <span key={sIdx} className={`ht-tok-${span.type}`}>
                      {span.text}
                    </span>
                  ))}
            </div>
          ))}
        </pre>

        <textarea
          aria-label="HyperTalk script editor"
          data-testid="script-editor"
          className="hc-code-textarea"
          spellCheck={false}
          value={value}
          placeholder={placeholder}
          onScroll={handleScroll}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

function countStatements(stmts: StatementNode[]): number {
  let total = 0;
  for (const s of stmts) {
    total++;
    if (s.kind === 'if') {
      total += countStatements(s.thenBranch) + countStatements(s.elseBranch);
    } else if (s.kind === 'repeatTimes' || s.kind === 'repeatWith' || s.kind === 'repeatWhile') {
      total += countStatements(s.body);
    }
  }
  return total;
}

function describeStatement(stmt: StatementNode): string {
  switch (stmt.kind) {
    case 'global':
      return `GlobalDecl(${stmt.names.join(', ')})`;
    case 'put':
      return `PutStmt(${stmt.mode} -> ${stmt.target.kind === 'variable' ? stmt.target.name : 'field'})`;
    case 'math':
      return `MathStmt(${stmt.op})`;
    case 'visualEffect':
      return `VisualEffect("${stmt.effect}")`;
    case 'goCard':
      return stmt.target.mode === 'relative'
        ? `GoCard(${stmt.target.dir})`
        : `GoCard(${stmt.target.expr.kind === 'string' ? `"${stmt.target.expr.value}"` : stmt.target.expr.kind})`;
    case 'visibility':
      return `${stmt.visible ? 'Show' : 'Hide'}(${stmt.objectKind})`;
    case 'setProp':
      return `SetProp(${stmt.objectKind}.${stmt.prop})`;
    case 'answer':
      return `AnswerDialog(${stmt.buttons.length || 1} btn)`;
    case 'ask':
      return 'AskDialog';
    case 'play':
      return `PlayAudio(${stmt.sound.kind === 'string' ? `"${stmt.sound.value}"` : 'expr'})`;
    case 'wait':
      return `Wait(${stmt.unit})`;
    case 'if':
      return `IfStmt(then:${stmt.thenBranch.length}, else:${stmt.elseBranch.length})`;
    case 'repeatTimes':
      return `RepeatTimes(body:${stmt.body.length})`;
    case 'repeatWith':
      return `RepeatWith(${stmt.varName}, body:${stmt.body.length})`;
    case 'repeatWhile':
      return `RepeatWhile(body:${stmt.body.length})`;
    case 'exitRepeat':
      return 'ExitRepeat';
    case 'exitHandler':
      return `ExitHandler(${stmt.handlerName})`;
    case 'return':
      return 'ReturnStmt';
    case 'call':
      return `CallHandler(${stmt.name})`;
  }
}

function AstStmtBranch({ stmt, depth }: { stmt: StatementNode; depth: number }) {
  return (
    <div style={{ paddingLeft: depth * 12 }}>
      <div className="hc-ast-node">
        <span className="hc-ast-line">L{stmt.line}</span>
        <span className="hc-ast-kind">{describeStatement(stmt)}</span>
      </div>
      {stmt.kind === 'if' && (
        <>
          {stmt.thenBranch.map((c, idx) => (
            <AstStmtBranch key={`t-${idx}`} stmt={c} depth={depth + 1} />
          ))}
          {stmt.elseBranch.map((c, idx) => (
            <AstStmtBranch key={`e-${idx}`} stmt={c} depth={depth + 1} />
          ))}
        </>
      )}
      {(stmt.kind === 'repeatTimes' || stmt.kind === 'repeatWith' || stmt.kind === 'repeatWhile') &&
        stmt.body.map((c, idx) => <AstStmtBranch key={`r-${idx}`} stmt={c} depth={depth + 1} />)}
    </div>
  );
}

export function AstTreeView({
  program,
  emptyLabel,
  handlersLabel,
  statementsLabel,
}: {
  program: ProgramNode;
  emptyLabel: string;
  handlersLabel: string;
  statementsLabel: string;
}) {
  const totalStatements = useMemo(
    () => program.handlers.reduce((acc, h) => acc + countStatements(h.body), 0),
    [program],
  );

  if (program.handlers.length === 0) {
    return <div style={{ color: 'var(--hc-ink-muted)', fontSize: 11 }}>{emptyLabel}</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        <div className="hc-panel-box" style={{ flex: 1, alignItems: 'center' }}>
          <span className="hc-section-label">{handlersLabel}</span>
          <strong style={{ fontSize: 15 }}>{program.handlers.length}</strong>
        </div>
        <div className="hc-panel-box" style={{ flex: 1, alignItems: 'center' }}>
          <span className="hc-section-label">{statementsLabel}</span>
          <strong style={{ fontSize: 15 }}>{totalStatements}</strong>
        </div>
      </div>

      <div className="hc-panel-box" style={{ maxHeight: 330, overflowY: 'auto', gap: 6 }}>
        {program.handlers.map((h: HandlerNode, idx: number) => (
          <div key={`${h.name}-${idx}`}>
            <div className="hc-ast-handler">
              <span className="hc-ast-line">L{h.line}</span>
              <strong>
                HandlerNode({h.name}
                {h.params.length > 0 ? `(${h.params.join(', ')})` : ''})
              </strong>
            </div>
            {h.body.map((stmt, sIdx) => (
              <AstStmtBranch key={sIdx} stmt={stmt} depth={1} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
