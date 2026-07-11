import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

export interface GalleryImage {
  url: string;
  nombre?: string;
  descripcion?: string;
}

interface ImageGalleryModalProps {
  show: boolean;
  images: GalleryImage[];
  startIndex?: number;
  onClose: () => void;
  title?: string;
}

const ImageGalleryModal: React.FC<ImageGalleryModalProps> = ({
  show,
  images,
  startIndex = 0,
  onClose,
  title,
}) => {
  const total = images.length;
  const safeStart = useMemo(() => {
    if (total === 0) return 0;
    if (startIndex < 0) return 0;
    if (startIndex >= total) return total - 1;
    return startIndex;
  }, [startIndex, total]);

  const [index, setIndex] = useState(safeStart);

  useEffect(() => {
    if (show) setIndex(safeStart);
  }, [show, safeStart]);

  const next = useCallback(() => {
    if (total <= 1) return;
    setIndex((i) => (i + 1) % total);
  }, [total]);

  const prev = useCallback(() => {
    if (total <= 1) return;
    setIndex((i) => (i - 1 + total) % total);
  }, [total]);

  useEffect(() => {
    if (!show) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [show, next, prev, onClose]);

  if (total === 0) return null;

  const current = images[index];

  return (
    <Modal
      show={show}
      onHide={onClose}
      size="lg"
      centered
      backdropClassName="image-gallery-modal-backdrop"
    >
      <Modal.Header closeButton>
        <Modal.Title>
          {title ?? current.nombre ?? 'Imagen'}{' '}
          <small className="text-muted ms-2">
            {index + 1} / {total}
          </small>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-0 bg-dark">
        <div className="d-flex align-items-center justify-content-center position-relative" style={{ minHeight: '50vh' }}>
          {total > 1 && (
            <Button
              variant="light"
              aria-label="Previous image"
              onClick={prev}
              className="position-absolute start-0 ms-2"
              style={{ zIndex: 5, opacity: 0.85 }}
            >
              <FaChevronLeft />
            </Button>
          )}
          <img
            src={current.url}
            alt={current.nombre ?? `image-${index + 1}`}
            style={{ maxHeight: '70vh', maxWidth: '100%', objectFit: 'contain' }}
            loading="lazy"
          />
          {total > 1 && (
            <Button
              variant="light"
              aria-label="Next image"
              onClick={next}
              className="position-absolute end-0 me-2"
              style={{ zIndex: 5, opacity: 0.85 }}
            >
              <FaChevronRight />
            </Button>
          )}
        </div>
        {current.descripcion && (
          <div className="p-2 text-center text-white bg-secondary bg-opacity-75 small">
            {current.descripcion}
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default ImageGalleryModal;
