"""Probe source and built MCP in disposable process groups; never a running service."""
import json
import os
from pathlib import Path
import signal
import subprocess
import sys

root = Path(__file__).resolve().parent.parent
cases = {
    'times-empty': 'repeat 20001 times\nend repeat',
    'with-empty': 'repeat with i = 1 to 20001\nend repeat',
    'with-descending': 'repeat with i = 20001 to 1\nend repeat',
    'while-empty': 'repeat while true\nend repeat',
    'positive-2pow53': 'repeat with i = 9007199254740992 to 9007199254740992\nend repeat',
    'negative-2pow53': 'repeat with i = -9007199254740992 to -9007199254740994\nend repeat',
}
results = []
for runtime in ('source', 'mcp'):
    for name, loop in cases.items():
        p = subprocess.Popen(
            ['node', '--import', 'tsx', 'tests/fixtures/sandbox-budget-probe.ts', loop, runtime],
            cwd=root, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, start_new_session=True,
        )
        item = {'runtime': runtime, 'case': name, 'timeoutSeconds': 5}
        try:
            stdout, stderr = p.communicate(timeout=5)
            item.update(exitCode=p.returncode, output=json.loads(stdout) if stdout else None)
            item['passed'] = p.returncode == 0 and 'Execution limit reached (10000 AST steps)' in str(item['output'].get('error'))
            if stderr: item['stderr'] = stderr
        except subprocess.TimeoutExpired:
            os.killpg(p.pid, signal.SIGKILL)
            p.communicate()
            item.update(passed=False, killedProcessGroup=True)
        except (ValueError, AttributeError) as error:
            item.update(passed=False, error=str(error))
        results.append(item)
out = root / 'docs/evidence/final-fixes'
out.mkdir(parents=True, exist_ok=True)
(out / 'sandbox-source-and-mcp.json').write_text(json.dumps(results, indent=2) + '\n')
print(f"{sum(x['passed'] for x in results)}/{len(results)} isolated source/MCP budget probes passed")
sys.exit(0 if all(x['passed'] for x in results) else 1)
