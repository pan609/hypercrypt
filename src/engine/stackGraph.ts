import { parseScript } from './parser';
import type { Stack, StatementNode, VisualEffect } from './types';

export interface StackGraphNode {
  cardIndex: number;
  cardId: string;
  cardName: string;
  objectCount: number;
  scriptedObjectCount: number;
  hasBitmap: boolean;
  bitmapRle: string;
  syntaxErrorCount: number;
  brokenLinkCount: number;
}

export interface StackGraphEdge {
  id: string;
  fromIndex: number;
  toIndex: number | null;
  targetLabel: string;
  sourceObjectName: string;
  conditional: boolean;
  broken: boolean;
  effect: VisualEffect;
  line: number;
}

export interface StackGraph {
  nodes: StackGraphNode[];
  edges: StackGraphEdge[];
  totalScripts: number;
  totalErrors: number;
  brokenLinks: number;
  conditionalBranches: number;
}

function collectGoStatements(
  stmts: StatementNode[],
  inConditional: boolean,
  pendingEffect: { value: VisualEffect },
  out: Array<{
    target: Extract<StatementNode, { kind: 'goCard' }>['target'];
    conditional: boolean;
    effect: VisualEffect;
    line: number;
  }>,
): void {
  for (const s of stmts) {
    if (s.kind === 'visualEffect') {
      pendingEffect.value = s.effect;
    } else if (s.kind === 'goCard') {
      out.push({
        target: s.target,
        conditional: inConditional,
        effect: pendingEffect.value,
        line: s.line,
      });
      pendingEffect.value = 'none';
    } else if (s.kind === 'if') {
      collectGoStatements(s.thenBranch, true, { value: pendingEffect.value }, out);
      collectGoStatements(s.elseBranch, true, { value: pendingEffect.value }, out);
    } else if (s.kind === 'repeatTimes' || s.kind === 'repeatWith' || s.kind === 'repeatWhile') {
      collectGoStatements(s.body, true, { value: pendingEffect.value }, out);
    }
  }
}

export function analyzeStackGraph(stack: Stack): StackGraph {
  const cardNameToIndex = new Map<string, number>();
  stack.cards.forEach((c, idx) => {
    cardNameToIndex.set(c.name.trim().toLowerCase(), idx);
  });

  const nodes: StackGraphNode[] = [];
  const edges: StackGraphEdge[] = [];
  let totalScripts = 0;
  let totalErrors = 0;
  let brokenLinks = 0;
  let conditionalBranches = 0;

  stack.cards.forEach((card, cardIdx) => {
    let syntaxErrorCount = 0;
    let cardBrokenCount = 0;
    let scriptedObjectCount = 0;

    const inspectScript = (src: string, sourceObjectName: string) => {
      if (!src.trim()) return;
      totalScripts++;
      const { program, diagnostics } = parseScript(src);
      syntaxErrorCount += diagnostics.length;
      totalErrors += diagnostics.length;

      for (const h of program.handlers) {
        const goes: Array<{
          target: Extract<StatementNode, { kind: 'goCard' }>['target'];
          conditional: boolean;
          effect: VisualEffect;
          line: number;
        }> = [];
        collectGoStatements(h.body, false, { value: 'none' }, goes);

        for (const g of goes) {
          let toIndex: number | null = null;
          let targetLabel = '';
          let broken = false;

          if (g.target.mode === 'relative') {
            const count = stack.cards.length;
            if (g.target.dir === 'next') {
              toIndex = (cardIdx + 1) % count;
              targetLabel = 'next card';
            } else if (g.target.dir === 'prev') {
              toIndex = (cardIdx - 1 + count) % count;
              targetLabel = 'prev card';
            } else if (g.target.dir === 'first') {
              toIndex = 0;
              targetLabel = 'first card';
            } else {
              toIndex = count - 1;
              targetLabel = 'last card';
            }
          } else if (g.target.expr.kind === 'string') {
            targetLabel = g.target.expr.value;
            const found = cardNameToIndex.get(targetLabel.trim().toLowerCase());
            if (found !== undefined) {
              toIndex = found;
            } else {
              broken = true;
            }
          } else if (g.target.expr.kind === 'number') {
            const oneBased = Math.floor(g.target.expr.value);
            targetLabel = `card ${oneBased}`;
            if (oneBased >= 1 && oneBased <= stack.cards.length) {
              toIndex = oneBased - 1;
            } else {
              broken = true;
            }
          } else {
            targetLabel = 'dynamic card';
          }

          if (broken) {
            brokenLinks++;
            cardBrokenCount++;
          }
          if (g.conditional) conditionalBranches++;

          edges.push({
            id: `e-${cardIdx}-${edges.length}`,
            fromIndex: cardIdx,
            toIndex,
            targetLabel,
            sourceObjectName,
            conditional: g.conditional,
            broken,
            effect: g.effect,
            line: g.line,
          });
        }
      }
    };

    inspectScript(card.script, `card "${card.name}"`);
    for (const obj of card.objects) {
      if (obj.script.trim()) scriptedObjectCount++;
      inspectScript(obj.script, obj.name);
    }

    nodes.push({
      cardIndex: cardIdx,
      cardId: card.id,
      cardName: card.name,
      objectCount: card.objects.length,
      scriptedObjectCount,
      hasBitmap: card.bitmapRle.length > 0,
      bitmapRle: card.bitmapRle,
      syntaxErrorCount,
      brokenLinkCount: cardBrokenCount,
    });
  });

  return {
    nodes,
    edges,
    totalScripts,
    totalErrors,
    brokenLinks,
    conditionalBranches,
  };
}
