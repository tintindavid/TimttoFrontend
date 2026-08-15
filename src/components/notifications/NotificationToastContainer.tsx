import React from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';
import { NotificationToastItem } from '@/types/notification.types';

interface Props {
  toasts: NotificationToastItem[];
  onDismiss: (id: string) => void;
}

/**
 * Transient real-time toasts for incoming `notification` socket events.
 * React-Bootstrap `<Toast>` handles auto-dismiss via `autohide`/`delay` — no
 * manual timers needed. Rendered by NotificationSocketProvider.
 */
const NotificationToastContainer: React.FC<Props> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <ToastContainer position="top-end" className="p-3" style={{ zIndex: 1080 }}>
      {toasts.map((item) => (
        <Toast key={item.id} onClose={() => onDismiss(item.id)} autohide delay={5000} bg="light">
          <Toast.Header>
            <strong className="me-auto">{item.title}</strong>
          </Toast.Header>
          <Toast.Body>{item.body}</Toast.Body>
        </Toast>
      ))}
    </ToastContainer>
  );
};

export default NotificationToastContainer;
