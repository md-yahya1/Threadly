import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, UserPlus, MessageSquare, Reply } from 'lucide-react';
import { api } from '../../services/api';
import { formatRelativeTime } from '../../utils/time';
import { useToast } from '../../context/ToastContext';
import Avatar from '../common/Avatar';
import './NotificationsMenu.css';

const POLL_INTERVAL_MS = 60000;

const TYPE_ICONS = {
  NEW_FOLLOWER: UserPlus,
  POST_REPLY: MessageSquare,
  COMMENT_REPLY: Reply
};

export default function NotificationsMenu({ onOpenProfile, onOpenPost }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);
  const { addToast } = useToast();

  const refreshUnreadCount = useCallback(() => {
    api.getUnreadNotificationCount()
      .then(data => setUnreadCount(data?.unreadCount || 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshUnreadCount();
    const timer = setInterval(refreshUnreadCount, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [refreshUnreadCount]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    if (!next) return;

    setLoading(true);
    api.getNotifications()
      .then(data => setItems(data?.content || []))
      .catch(err => addToast(err.message || 'Could not load notifications', 'error'))
      .finally(() => setLoading(false));
  };

  const handleItemClick = async notification => {
    setOpen(false);

    if (!notification.read) {
      setItems(prev => prev.map(n => (n.id === notification.id ? { ...n, read: true } : n)));
      setUnreadCount(prev => Math.max(0, prev - 1));
      api.markNotificationRead(notification.id)
        .then(data => setUnreadCount(data?.unreadCount || 0))
        .catch(() => refreshUnreadCount());
    }

    if (notification.type === 'NEW_FOLLOWER') {
      if (notification.actor?.username) onOpenProfile?.(notification.actor.username);
    } else if (notification.referenceId) {
      onOpenPost?.(notification.referenceId);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setItems(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      addToast(err.message || 'Could not update notifications', 'error');
    }
  };

  return (
    <div className="notif-menu-container" ref={containerRef}>
      <button className="icon-btn notif-btn" title="Notifications" onClick={toggleOpen}>
        <Bell size={18} />
        {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-dropdown-header">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <button className="notif-mark-all" onClick={handleMarkAllRead}>
                <CheckCheck size={14} />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          <div className="notif-list">
            {loading ? (
              <div className="notif-empty">Loading...</div>
            ) : items.length ? (
              items.map(n => {
                const Icon = TYPE_ICONS[n.type] || Bell;
                return (
                  <button
                    key={n.id}
                    className={`notif-item ${n.read ? '' : 'unread'}`}
                    onClick={() => handleItemClick(n)}
                  >
                    <Avatar name={n.actor?.username || 'Threadly'} src={n.actor?.avatarUrl} size="sm" />
                    <div className="notif-item-body">
                      <span className="notif-message">{n.message}</span>
                      <span className="notif-time">
                        <Icon size={12} />
                        {formatRelativeTime(n.createdAt)}
                      </span>
                    </div>
                    {!n.read && <span className="notif-unread-dot" />}
                  </button>
                );
              })
            ) : (
              <div className="notif-empty">You're all caught up.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
