import React from 'react';
import { Badge, Dropdown, Spinner } from 'react-bootstrap';
import { FaBell } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useNotifications, useUnreadCount, useMarkAsRead } from '@/hooks/useNotifications';
import { Notification } from '@/types/notification.types';

const RECENT_LIMIT = 10;

const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const { data: unreadData } = useUnreadCount();
  const { data: recentData, isLoading } = useNotifications({ page: 1, limit: RECENT_LIMIT });
  const markAsRead = useMarkAsRead();

  const unreadCount = unreadData?.data?.count ?? 0;
  const items = recentData?.data ?? [];

  const handleItemClick = (item: Notification) => {
    if (!item.readAt) {
      markAsRead.mutate(item._id);
    }
    // Only navigate to strictly-internal paths — prevents a future phase-2
    // event whose payload includes `data.link = "https://evil.example"` from
    // hijacking the SPA into an off-site redirect.
    const raw = item.data && typeof item.data.link === 'string' ? item.data.link : null;
    if (raw && raw.startsWith('/') && !raw.startsWith('//')) {
      navigate(raw);
    }
  };

  return (
    <Dropdown align="end" className="me-2">
      <Dropdown.Toggle
        as="button"
        className="btn btn-link text-white position-relative border-0 p-0"
        id="notification-bell"
        aria-label={unreadCount > 0 ? `Notificaciones, ${unreadCount} sin leer` : 'Notificaciones'}
      >
        <FaBell size={20} />
        {unreadCount > 0 && (
          <Badge
            bg="danger"
            pill
            className="position-absolute top-0 start-100 translate-middle"
            style={{ fontSize: '0.6rem' }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Dropdown.Toggle>
      <Dropdown.Menu style={{ minWidth: 320, maxHeight: 400, overflowY: 'auto' }}>
        <Dropdown.Header>Notificaciones</Dropdown.Header>
        {isLoading && (
          <div className="text-center py-3">
            <Spinner animation="border" size="sm" aria-label="Cargando notificaciones" />
          </div>
        )}
        {!isLoading && items.length === 0 && (
          <div className="text-center text-muted py-3 px-2">Aún no tienes notificaciones.</div>
        )}
        {items.map((item) => (
          <Dropdown.Item key={item._id} onClick={() => handleItemClick(item)} className={item.readAt ? '' : 'fw-semibold'}>
            <div className="text-truncate">{item.title}</div>
            <small className="text-muted d-block text-truncate">{item.body}</small>
          </Dropdown.Item>
        ))}
        <Dropdown.Divider />
        <Dropdown.Item onClick={() => navigate('/notifications')} className="text-center text-primary">
          Ver todas
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default NotificationBell;
