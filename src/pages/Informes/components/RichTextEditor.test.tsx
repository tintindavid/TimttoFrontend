import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RichTextEditor } from './RichTextEditor';

describe('RichTextEditor', () => {
  it('renders the toolbar with accessible labels', async () => {
    render(<RichTextEditor value="" onChange={() => {}} />);
    for (const name of ['Negrita', 'Cursiva', 'Subrayado', 'Título 1', 'Lista con viñetas', 'Lista numerada', 'Salto de línea']) {
      expect(await screen.findByRole('button', { name })).toBeInTheDocument();
    }
  });

  it('shows the character counter with the limit', async () => {
    render(<RichTextEditor value="<p>hola</p>" onChange={() => {}} maxLength={20000} />);
    const counter = await screen.findByTestId('char-counter');
    await waitFor(() => expect(counter.textContent).toMatch(/\/ 20000$/));
    expect(counter.textContent).toContain(String('<p>hola</p>'.length));
  });

  it('flags the counter when the limit is exceeded', async () => {
    render(<RichTextEditor value="<p>abcdefghij</p>" onChange={() => {}} maxLength={5} />);
    const counter = await screen.findByTestId('char-counter');
    await waitFor(() => expect(counter).toHaveClass('text-danger'));
  });

  it('emits HTML when a format is applied', async () => {
    const onChange = vi.fn();
    render(<RichTextEditor value="<p>texto</p>" onChange={onChange} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Lista con viñetas' }));
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(onChange.mock.calls[onChange.mock.calls.length - 1][0]).toContain('<ul>');
  });

  it('does not emit onChange when only the disabled flag toggles', async () => {
    const onChange = vi.fn();
    const { rerender } = render(<RichTextEditor value="<p>texto</p>" onChange={onChange} />);
    await screen.findByRole('button', { name: 'Negrita' });
    rerender(<RichTextEditor value="<p>texto</p>" onChange={onChange} disabled />);
    rerender(<RichTextEditor value="<p>texto</p>" onChange={onChange} />);
    await new Promise((r) => setTimeout(r, 50));
    expect(onChange).not.toHaveBeenCalled();
  });
});
