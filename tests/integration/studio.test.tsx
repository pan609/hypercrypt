import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from '../../src/App';

describe('HyperCrypt Studio Integration Flows', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.location.hash = '';
  });

  it('boots directly into Browse Mode on Card 1 of The Attic Mac of 1987 and solves Card 1 puzzle', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByTestId('window-title')).toHaveTextContent('The Attic Mac of 1987 — Attic (1/6)');

    // Click MacSpirit hotspot -> answer modal opens
    await user.click(screen.getByRole('button', { name: 'MacSpirit' }));
    expect(await screen.findByTestId('ht-modal')).toHaveTextContent('Boot floppy inserted');
    await user.click(screen.getByRole('button', { name: 'Awesome!' }));

    // Now Wake HyperCard advances to Card 2
    await user.click(screen.getByRole('button', { name: 'Wake HyperCard' }));
    await waitFor(() => {
      expect(screen.getByTestId('window-title')).toHaveTextContent('Boot Floppy (2/6)');
    });
  });

  it('switches between 1987 Cream and Kiroween Dusk skins', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    const appEl = container.querySelector('.hc-app');
    expect(appEl).toHaveAttribute('data-hc-theme', 'classic');

    await user.click(screen.getByRole('button', { name: 'Kiroween Dusk' }));
    expect(appEl).toHaveAttribute('data-hc-theme', 'kiroween');
  });

  it('switches to Author Mode, validates HyperTalk live, and runs Message Box commands', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Peek Script enters Author Mode with Script tab open
    await user.click(screen.getByRole('button', { name: /Peek Script/i }));
    const editor = await screen.findByTestId('script-editor');
    expect(screen.getByTestId('ast-status')).toHaveTextContent('✓ Valid AST');

    // Introduce syntax error -> live diagnostic appears
    await user.clear(editor);
    await user.type(editor, 'on mouseUp\n  put "oops\nend mouseUp');
    expect(screen.getByTestId('ast-status')).toHaveTextContent('Error');

    // Open Message Box and jump directly to card 3
    await user.click(screen.getByRole('button', { name: /Msg/i }));
    const msgInput = screen.getByTestId('msgbox-input');
    await user.clear(msgInput);
    await user.type(msgInput, 'go to card 3{Enter}');

    await waitFor(() => {
      expect(screen.getByTestId('window-title')).toHaveTextContent('Time Dial (3/6)');
    });
  });
});
