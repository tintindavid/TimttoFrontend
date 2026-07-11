import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import ImageGalleryModal, { GalleryImage } from './ImageGalleryModal';

afterEach(() => cleanup());

const three: GalleryImage[] = [
  { url: 'https://example.com/a.jpg', nombre: 'A' },
  { url: 'https://example.com/b.jpg', nombre: 'B' },
  { url: 'https://example.com/c.jpg', nombre: 'C' },
];

describe('ImageGalleryModal', () => {
  test('renders nothing when images array is empty', () => {
    const { container } = render(
      <ImageGalleryModal show images={[]} onClose={() => {}} />
    );
    expect(container.querySelector('.modal')).toBeNull();
  });

  test('shows the image at startIndex with counter "i+1 / total"', () => {
    render(<ImageGalleryModal show images={three} startIndex={1} onClose={() => {}} />);
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/b.jpg');
  });

  test('next from last index wraps back to first (circular)', () => {
    render(<ImageGalleryModal show images={three} startIndex={2} onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /next image/i }));
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/a.jpg');
  });

  test('prev from index 0 wraps to last (circular)', () => {
    render(<ImageGalleryModal show images={three} startIndex={0} onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /previous image/i }));
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/c.jpg');
  });

  test('hides navigation arrows when only one image is present', () => {
    render(
      <ImageGalleryModal
        show
        images={[{ url: 'https://example.com/only.jpg', nombre: 'Only' }]}
        onClose={() => {}}
      />
    );
    expect(screen.queryByRole('button', { name: /next image/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /previous image/i })).toBeNull();
  });

  test('ArrowRight key advances, ArrowLeft goes back, ESC calls onClose', () => {
    const onClose = vi.fn();
    render(<ImageGalleryModal show images={three} startIndex={0} onClose={onClose} />);

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByText('2 / 3')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(screen.getByText('1 / 3')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
