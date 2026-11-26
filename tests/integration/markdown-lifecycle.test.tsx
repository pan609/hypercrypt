import { StrictMode } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { MarkdownStudioView } from '../../src/studio/components/MarkdownStudioView';

const { template, preferences } = vi.hoisted(() => ({
  template: `# Initialization
## Card: Start
uninitialized
\`\`\`hypertalk
on openCard
  global visits
  if visits = "" then put 0 into visits
  add 1 to visits
  put "INITIALIZED " & visits into field "Body"
end openCard
\`\`\``,
  preferences: { theme: 'classic' },
}));

vi.mock('../../src/presets/prodRunbook502', () => ({
  PROD_502_RUNBOOK_MD: template,
  PROD_502_RUNBOOK_MD_ZH: template,
}));
vi.mock('../../src/studio/store/useStudioStore', async () => {
  const { MESSAGES } = await import('../../src/studio/i18n/messages');
  return { useStudio: () => ({
    locale: 'en', theme: preferences.theme, muted: true, t: MESSAGES.en,
    loadCustomStack: vi.fn(), exportHtmlFile: vi.fn(),
  }) };
});

it('initializes the first compiled card exactly once, including StrictMode and source changes', async () => {
  const view = render(<StrictMode><MarkdownStudioView /></StrictMode>);
  await waitFor(() => expect(screen.getByText('INITIALIZED 1')).toBeInTheDocument());
  expect(screen.queryByText('uninitialized')).not.toBeInTheDocument();

  fireEvent.change(screen.getByTestId('md-source-input'), {
    target: { value: template.replace('INITIALIZED', 'UPDATED') },
  });
  await waitFor(() => expect(screen.getByText('UPDATED 1')).toBeInTheDocument());

  preferences.theme = 'kiroween';
  view.rerender(<StrictMode><MarkdownStudioView /></StrictMode>);
  expect(screen.getByText('UPDATED 1')).toBeInTheDocument();
  expect(screen.queryByText('UPDATED 2')).not.toBeInTheDocument();
});

it('cancels an old waiting initializer before it can mutate a newly compiled preview', async () => {
  render(<MarkdownStudioView />);
  await screen.findByText('INITIALIZED 1');
  const source = screen.getByTestId('md-source-input');
  fireEvent.change(source, { target: { value: '# Old\n## Card: Start\nold\n```hypertalk\non openCard\nput "WAITING" into field "Body"\nwait 0.05 seconds\nput "STALE" into field "Body"\nend openCard\n```' } });
  await screen.findByText('WAITING');
  fireEvent.change(source, { target: { value: template.replace('INITIALIZED', 'FRESH') } });
  await screen.findByText('FRESH 1');
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 80)); });
  expect(screen.getByText('FRESH 1')).toBeInTheDocument();
  expect(screen.queryByText('STALE')).not.toBeInTheDocument();
});

it('releases abandoned ask/answer initializers without exhausting the six-layer guard', async () => {
  render(<MarkdownStudioView />);
  await screen.findByText('INITIALIZED 1');
  const source = screen.getByTestId('md-source-input');
  for (let i = 0; i < 8; i++) {
    const dialog = i % 2 === 0 ? `ask "Prompt ${i}"` : `answer "Prompt ${i}" with "OK"`;
    fireEvent.change(source, { target: { value: `# Dialog ${i}\n## Card: Start\nwaiting\n\`\`\`hypertalk\non openCard\n${dialog}\nend openCard\n\`\`\`` } });
    await screen.findByText(`Prompt ${i}`);
  }
  fireEvent.change(source, { target: { value: template.replace('INITIALIZED', 'RECOVERED') } });
  await screen.findByText('RECOVERED 1');
  expect(screen.queryByText('Prompt 7')).not.toBeInTheDocument();
});
