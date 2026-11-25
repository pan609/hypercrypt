import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { runStackHeadless } from '../src/engine/headlessHost';
import { compileMarkdownToStack } from '../src/engine/markdownCompiler';
import { parseScript } from '../src/engine/parser';
import type { Stack } from '../src/engine/types';
import { validateStack } from '../src/engine/validator';

export function createHyperCryptMcpServer(): McpServer {
  const server = new McpServer({
    name: 'hypercrypt-mcp',
    version: '1.0.0',
  });

  server.tool(
    'validate_hypertalk',
    'Parse HyperTalk v1.0 script source using HyperCrypt AST parser and return handler signatures and line/column diagnostics.',
    {
      script: z.string().describe('HyperTalk source code to validate'),
    },
    async ({ script }) => {
      const { program, diagnostics } = parseScript(script);
      const payload = {
        valid: diagnostics.length === 0,
        handlers: program.handlers.map((h) => ({
          name: h.name,
          params: h.params,
          line: h.line,
          statementCount: h.body.length,
        })),
        diagnostics,
      };
      return {
        content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
      };
    },
  );

  server.tool(
    'validate_stack',
    'Validate a HyperCrypt .hcstack.json document for schema conformance, HyperTalk syntax errors, and broken go-to-card references.',
    {
      stackJson: z.string().describe('JSON string of a HyperCrypt Stack'),
    },
    async ({ stackJson }) => {
      let stack: Stack;
      try {
        stack = JSON.parse(stackJson) as Stack;
      } catch (err) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                valid: false,
                error: `Invalid JSON: ${err instanceof Error ? err.message : String(err)}`,
              }),
            },
          ],
        };
      }
      const issues = validateStack(stack);
      const errorCount = issues.filter((i) => i.severity === 'error').length;
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                valid: errorCount === 0,
                errorCount,
                issueCount: issues.length,
                issues,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  server.tool(
    'run_hypertalk_script',
    'Execute a card or object HyperTalk handler headlessly in the HyperCrypt sandbox and return resulting card, globals, fields, audio, dialogs, and execution trace.',
    {
      stackJson: z.string().describe('JSON string of a HyperCrypt Stack'),
      cardIndex: z.number().int().min(0).optional().describe('0-based starting card index (default 0)'),
      targetName: z.string().optional().describe('Object name on the card to invoke (e.g. button name)'),
      handler: z.string().optional().describe('Handler name (default mouseUp when targetName given, else openCard)'),
      initialGlobals: z.record(z.string()).optional().describe('Optional initial global variable values'),
      askResponses: z.array(z.string()).optional().describe('Mock user responses for ask dialogs'),
      answerResponses: z.array(z.string()).optional().describe('Mock button clicks for answer dialogs'),
    },
    async ({ stackJson, cardIndex, targetName, handler, initialGlobals, askResponses, answerResponses }) => {
      let stack: Stack;
      try {
        stack = JSON.parse(stackJson) as Stack;
      } catch (err) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: `Invalid JSON: ${err instanceof Error ? err.message : String(err)}` }),
            },
          ],
        };
      }
      const result = await runStackHeadless({
        stack,
        cardIndex,
        targetName,
        handler,
        initialGlobals,
        askResponses,
        answerResponses,
      });
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    'compile_markdown_to_stack',
    'Compile structured Markdown (## Card: Name headings, text, - [Label -> Target] links, optional ```hypertalk blocks) into a validated HyperCrypt .hcstack.json Stack.',
    {
      markdown: z.string().describe('Structured Markdown document'),
      title: z.string().optional().describe('Optional Stack title override'),
      author: z.string().optional().describe('Optional Stack author'),
      defaultTheme: z.enum(['classic', 'kiroween']).optional().describe('Default visual theme'),
    },
    async ({ markdown, title, author, defaultTheme }) => {
      const stack = compileMarkdownToStack(markdown, { title, author, defaultTheme });
      const issues = validateStack(stack);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                cardCount: stack.cards.length,
                validationIssues: issues,
                stack,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  return server;
}

const isEntrypoint =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  (process.argv[1].endsWith('server.js') || process.argv[1].endsWith('server.ts'));

if (isEntrypoint) {
  const server = createHyperCryptMcpServer();
  const transport = new StdioServerTransport();
  server.connect(transport).catch((err) => {
    console.error('[hypercrypt-mcp] Fatal error:', err);
    process.exit(1);
  });
}
