// Run only in a disposable OS process with a parent-enforced timeout.
import { runStackHeadless } from '../../src/engine/headlessHost';
import type { Stack } from '../../src/engine/types';

const loop = process.argv[2];
const stack: Stack = {
    schemaVersion: 1, id: 'sandbox-budget-probe', title: 'Sandbox Budget Probe',
    author: 'Test', description: '', script: '',
    cards: [{
      id: 'start', name: 'Start', bitmapRle: '', objects: [],
      script: `on openCard\n${loop}\nend openCard`,
    }],
};
let result;
if (process.argv[3] === 'mcp') {
  const { Client } = await import('@modelcontextprotocol/sdk/client/index.js');
  const { StdioClientTransport } = await import('@modelcontextprotocol/sdk/client/stdio.js');
  const client = new Client({ name: 'isolated-budget-probe', version: '1.0.0' });
  await client.connect(new StdioClientTransport({ command: process.execPath, args: ['dist-mcp/server.js'] }));
  try {
    const response = await client.callTool({ name: 'run_hypertalk_script', arguments: { stackJson: JSON.stringify(stack) } });
    result = JSON.parse((response.content as Array<{ text: string }>)[0].text);
  } finally {
    await client.close();
  }
} else {
  result = await runStackHeadless({ stack });
}
process.stdout.write(JSON.stringify(result));
