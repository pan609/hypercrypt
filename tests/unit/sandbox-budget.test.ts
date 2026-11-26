// @vitest-environment node
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

const probe = fileURLToPath(new URL('../fixtures/sandbox-budget-probe.ts', import.meta.url));

it.each([
  ['empty counted loop', 'repeat 20001 times\nend repeat'],
  ['empty counter loop', 'repeat with i = 1 to 20001\nend repeat'],
  ['empty descending loop', 'repeat with i = 20001 to 1\nend repeat'],
  ['empty while loop', 'repeat while true\nend repeat'],
  ['non-advancing 2^53 counter', 'repeat with i = 9007199254740992 to 9007199254740992\nend repeat'],
  ['negative precision boundary', 'repeat with i = -9007199254740992 to -9007199254740994\nend repeat'],
])('bounds %s with the same execution budget', (_name, loop) => {
  // A future regression must kill only this disposable child, never hang Vitest/MCP.
  const output = execFileSync(process.execPath, ['--import', 'tsx', probe, loop], {
    timeout: 3000, killSignal: 'SIGKILL', encoding: 'utf8',
  });
  const result = JSON.parse(output);
  expect(result.error).toMatch(/Execution limit reached \(10000 AST steps\)/);
}, 5000);

it('counts empty finite iterations and preserves ascending/descending/exit semantics', () => {
  const output = execFileSync(process.execPath, ['--import', 'tsx', probe, `global total
put 0 into total
repeat 3 times
end repeat
repeat with i = 3 to 1
  add i to total
end repeat
repeat while total < 8
  add 1 to total
end repeat
repeat 99 times
  exit repeat
end repeat`], { timeout: 3000, killSignal: 'SIGKILL', encoding: 'utf8' });
  const result = JSON.parse(output);
  expect(result.error).toBeUndefined();
  expect(result.globals.total).toBe('8');
  // Statement execution + every iteration share a single counter.
  expect(result.stepsExecuted).toBe(21);
});
