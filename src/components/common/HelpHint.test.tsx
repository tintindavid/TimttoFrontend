import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HelpHint from './HelpHint';

const renderHint = () =>
  render(
    <div>
      <HelpHint title="Estado">Explica el estado de la requisición.</HelpHint>
      <button type="button">Fuera</button>
    </div>
  );

describe('HelpHint', () => {
  it('renders an accessible button labelled "Ayuda: <title>" with the popover closed', () => {
    renderHint();
    const button = screen.getByRole('button', { name: 'Ayuda: Estado' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Explica el estado de la requisición.')).not.toBeInTheDocument();
  });

  it('opens on click, showing the title and the content', async () => {
    const user = userEvent.setup();
    renderHint();
    const button = screen.getByRole('button', { name: 'Ayuda: Estado' });
    await user.click(button);
    expect(await screen.findByText('Explica el estado de la requisición.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Estado' })).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('opens with the keyboard (Enter) and closes with Escape', async () => {
    const user = userEvent.setup();
    renderHint();
    const button = screen.getByRole('button', { name: 'Ayuda: Estado' });
    button.focus();
    await user.keyboard('{Enter}');
    expect(await screen.findByText('Explica el estado de la requisición.')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByText('Explica el estado de la requisición.')).not.toBeInTheDocument());
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes when clicking outside', async () => {
    const user = userEvent.setup();
    renderHint();
    await user.click(screen.getByRole('button', { name: 'Ayuda: Estado' }));
    expect(await screen.findByText('Explica el estado de la requisición.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Fuera' }));
    await waitFor(() => expect(screen.queryByText('Explica el estado de la requisición.')).not.toBeInTheDocument());
  });

  it('toggles closed when the button is clicked again', async () => {
    const user = userEvent.setup();
    renderHint();
    const button = screen.getByRole('button', { name: 'Ayuda: Estado' });
    await user.click(button);
    await screen.findByText('Explica el estado de la requisición.');
    await user.click(button);
    await waitFor(() => expect(screen.queryByText('Explica el estado de la requisición.')).not.toBeInTheDocument());
  });

  it('renders the popover outside its container so tables and modals cannot clip it', async () => {
    const user = userEvent.setup();
    const { container } = renderHint();
    await user.click(screen.getByRole('button', { name: 'Ayuda: Estado' }));
    const text = await screen.findByText('Explica el estado de la requisición.');
    expect(container.contains(text)).toBe(false);
    expect(document.body.contains(text)).toBe(true);
  });
});
