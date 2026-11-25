import { validateStack } from '../src/engine/validator';
import { BUILTIN_PRESETS, createBlankStack } from '../src/presets';
import type { Locale } from '../src/studio/i18n/messages';

let totalErrors = 0;
const locales: Locale[] = ['en', 'zh'];

for (const locale of locales) {
  for (const preset of BUILTIN_PRESETS) {
    const stack = preset.create(locale);
    const issues = validateStack(stack);
    const errors = issues.filter((i) => i.severity === 'error');
    totalErrors += errors.length;
    console.log(
      `[${errors.length === 0 ? 'PASS' : 'FAIL'}] [${locale}] ${stack.title} (${stack.cards.length} cards) — ${issues.length} issue(s)`,
    );
    for (const issue of issues) {
      console.log(`  - [${issue.severity}] ${issue.location}${issue.line ? `:${issue.line}` : ''}: ${issue.message}`);
    }
  }
}

for (const locale of locales) {
  const blankIssues = validateStack(createBlankStack(locale));
  const blankErrors = blankIssues.filter((i) => i.severity === 'error');
  totalErrors += blankErrors.length;
  console.log(`[${blankErrors.length === 0 ? 'PASS' : 'FAIL'}] [${locale}] Blank Stack Template — ${blankIssues.length} issue(s)`);
}

if (totalErrors > 0) {
  console.error(`\nPreset validation failed with ${totalErrors} error(s).`);
  process.exit(1);
}
console.log('\nAll EN + ZH built-in HyperCrypt stacks passed static validation.');
