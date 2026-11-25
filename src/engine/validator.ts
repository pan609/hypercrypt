import { parseScript } from './parser';
import type { Stack, StatementNode, ValidationIssue } from './types';

function walkStatements(stmts: StatementNode[], visitor: (s: StatementNode) => void): void {
  for (const s of stmts) {
    visitor(s);
    if (s.kind === 'if') {
      walkStatements(s.thenBranch, visitor);
      walkStatements(s.elseBranch, visitor);
    } else if (s.kind === 'repeatTimes' || s.kind === 'repeatWith' || s.kind === 'repeatWhile') {
      walkStatements(s.body, visitor);
    }
  }
}

export function validateStack(stack: Stack): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (stack.schemaVersion !== 1) {
    issues.push({
      severity: 'error',
      location: 'stack',
      message: `Unsupported schemaVersion: ${String(stack.schemaVersion)} (expected 1)`,
    });
  }

  if (!stack.title || !stack.title.trim()) {
    issues.push({
      severity: 'warning',
      location: 'stack',
      message: 'Stack title is empty',
    });
  }

  if (!Array.isArray(stack.cards) || stack.cards.length === 0) {
    issues.push({
      severity: 'error',
      location: 'stack',
      message: 'Stack must contain at least one card',
    });
    return issues;
  }

  const cardIds = new Set<string>();
  const cardNamesLower = new Set<string>();

  for (const card of stack.cards) {
    if (cardIds.has(card.id)) {
      issues.push({
        severity: 'error',
        location: `card:${card.id}`,
        message: `Duplicate card id '${card.id}'`,
      });
    }
    cardIds.add(card.id);
    cardNamesLower.add(card.name.trim().toLowerCase());
  }

  const checkScript = (source: string, location: string) => {
    if (!source.trim()) return;
    const { program, diagnostics } = parseScript(source);
    for (const d of diagnostics) {
      issues.push({
        severity: 'error',
        location,
        line: d.line,
        message: `HyperTalk syntax error (col ${d.column}): ${d.message}`,
      });
    }

    for (const h of program.handlers) {
      walkStatements(h.body, (stmt) => {
        if (stmt.kind === 'goCard' && stmt.target.mode === 'expr') {
          if (stmt.target.expr.kind === 'string') {
            const targetName = stmt.target.expr.value.trim().toLowerCase();
            if (!cardNamesLower.has(targetName)) {
              issues.push({
                severity: 'error',
                location,
                line: stmt.line,
                message: `Broken card link: go to card "${stmt.target.expr.value}" does not match any card name`,
              });
            }
          } else if (stmt.target.expr.kind === 'number') {
            const idx = stmt.target.expr.value;
            if (idx < 1 || idx > stack.cards.length || !Number.isInteger(idx)) {
              issues.push({
                severity: 'error',
                location,
                line: stmt.line,
                message: `Card index ${idx} is out of bounds (1..${stack.cards.length})`,
              });
            }
          }
        }
      });
    }
  };

  checkScript(stack.script, 'stack.script');

  stack.cards.forEach((card, cardIdx) => {
    const cardLoc = `card[${cardIdx + 1}] "${card.name}"`;
    checkScript(card.script, cardLoc);

    const objIds = new Set<string>();
    for (const obj of card.objects) {
      if (objIds.has(obj.id)) {
        issues.push({
          severity: 'error',
          location: `${cardLoc} > ${obj.type} "${obj.name}"`,
          message: `Duplicate object id '${obj.id}' on card`,
        });
      }
      objIds.add(obj.id);
      checkScript(obj.script, `${cardLoc} > ${obj.type} "${obj.name}"`);
    }
  });

  return issues;
}
