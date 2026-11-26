import path from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { describe, expect, it } from 'vitest';
import { exportStackToHtml } from '../../src/engine/htmlExporter';
import { compileMarkdownToStack } from '../../src/engine/markdownCompiler';
import { decodeStackFromHash, encodeStackToHash } from '../../src/engine/urlShare';
import { validateStack } from '../../src/engine/validator';
import { createProdRunbookStack, PROD_502_RUNBOOK_MD } from '../../src/presets/prodRunbook502';
import { createStarlightRpgStack } from '../../src/presets/starlightRpg';

describe('Markdown Compiler, URL Share & Single-File HTML Export', () => {
  it('compiles Prod 502 Markdown runbook into exact 5 valid cards with zero issues', () => {
    const stack = createProdRunbookStack();
    expect(stack.cards).toHaveLength(5);
    expect(stack.cards[0].name).toBe('502 Alert Received');
    expect(validateStack(stack)).toEqual([]);
  });

  it('preserves >3 navigation buttons cleanly across 2 rows without dropping links', () => {
    const md = `# Multi-Branch
## Card: Hub
Choose one of 5 destinations:
- [Go A -> A]
- [Go B -> B]
- [Go C -> C]
- [Go D -> D]
- [Go E -> E]
## Card: A
A
## Card: B
B
## Card: C
C
## Card: D
D
## Card: E
E`;
    const stack = compileMarkdownToStack(md);
    const hubButtons = stack.cards[0].objects.filter((o) => o.type === 'button');
    expect(hubButtons).toHaveLength(5);
    expect(validateStack(stack)).toEqual([]);
  });

  it('round-trips a stack through URL hash encoding', () => {
    const stack = compileMarkdownToStack('# Mini\n## Card: One\nHello!\n- [Go -> Two]\n## Card: Two\nDone!');
    const hash = encodeStackToHash(stack);
    expect(hash.startsWith('#stack=')).toBe(true);
    const decoded = decodeStackFromHash(hash);
    expect(decoded?.title).toBe('Mini');
    expect(decoded?.cards).toHaveLength(2);
  });

  it('safely escapes </script> payloads during single-file HTML export', () => {
    const stack = compileMarkdownToStack('# Test </script><script>alert(1)</script>\n## Card: A\nHello </script>');
    const html = exportStackToHtml(stack, 'console.log("ok");', 'classic');
    expect(html).not.toContain('</script><script>alert(1)');
    expect(html).toContain('\\u003c/script\\u003e');
  });
});

describe('hypercrypt-mcp Live Stdio Server (4 Tools)', () => {
  it('lists and executes all 4 MCP tools over stdio JSON-RPC', async () => {
    const serverPath = path.resolve(process.cwd(), 'dist-mcp/server.js');
    const transport = new StdioClientTransport({
      command: 'node',
      args: [serverPath],
    });
    const client = new Client({ name: 'vitest-mcp-client', version: '1.0.0' });
    await client.connect(transport);

    try {
      const tools = await client.listTools();
      const names = tools.tools.map((t) => t.name).sort();
      expect(names).toEqual([
        'compile_markdown_to_stack',
        'run_hypertalk_script',
        'validate_hypertalk',
        'validate_stack',
      ]);

      // 1. validate_hypertalk
      const valRes = await client.callTool({
        name: 'validate_hypertalk',
        arguments: { script: 'on mouseUp\n  play "chime"\nend mouseUp' },
      });
      const valJson = JSON.parse((valRes.content as Array<{ text: string }>)[0].text);
      expect(valJson.valid).toBe(true);
      expect(valJson.handlers[0].name).toBe('mouseup');

      // 2. compile_markdown_to_stack
      const compRes = await client.callTool({
        name: 'compile_markdown_to_stack',
        arguments: { markdown: PROD_502_RUNBOOK_MD, title: 'Prod 502 Triage Runbook' },
      });
      const compJson = JSON.parse((compRes.content as Array<{ text: string }>)[0].text);
      expect(compJson.cardCount).toBe(5);
      expect(compJson.validationIssues).toEqual([]);

      // 3. validate_stack
      const stackJson = JSON.stringify(compJson.stack);
      const stRes = await client.callTool({
        name: 'validate_stack',
        arguments: { stackJson },
      });
      const stJson = JSON.parse((stRes.content as Array<{ text: string }>)[0].text);
      expect(stJson.valid).toBe(true);

      // 4. run_hypertalk_script
      const runRes = await client.callTool({
        name: 'run_hypertalk_script',
        arguments: {
          stackJson,
          cardIndex: 0,
          targetName: 'Recent Deploy (<15m)',
        },
      });
      const runJson = JSON.parse((runRes.content as Array<{ text: string }>)[0].text);
      expect(runJson.finalCardName).toBe('Check Rollback');
      expect(runJson.audioPlayed).toContain('click');

      // Check the committed MCP bundle, not just the source interpreter.
      for (const scenario of [
        { cardIndex: 3, targetName: 'Ending Open Source', initialGlobals: { hp: '8' }, field: 'EndingCard', text: 'Ending A · Open-Source Resurrector' },
        { cardIndex: 5, targetName: 'Respawn', initialGlobals: { hp: '0' }, field: 'HudStats', text: 'HP: 10' },
      ]) {
        const { field, text, ...args } = scenario;
        const result = await client.callTool({
          name: 'run_hypertalk_script',
          arguments: { stackJson: JSON.stringify(createStarlightRpgStack('en')), ...args },
        });
        const output = JSON.parse((result.content as Array<{ text: string }>)[0].text);
        expect(output.error).toBeUndefined();
        expect(output.fieldTexts[field]).toContain(text);
      }
    } finally {
      await client.close();
    }
  });
});
