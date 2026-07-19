import { useEffect, useRef } from 'react';
import { X, Bell, CheckCircle2, Info, AlertTriangle, Check } from 'lucide-react';
import { useState } from 'react';
import './NotificationsDrawer.css';

const MOCK_NOTIFICATIONS = [
  { id: 'n1', type: 'success', title: 'Simulation Complete', body: 'Series C Equity analysis is ready to review.', time: '2m ago', read: false },
  { id: 'n2', type: 'info',    title: 'AI Advisor Update',   body: 'New market correlation data is now available.', time: '1h ago', read: false },
  { id: 'n3', type: 'warning', title: 'Action Required',     body: 'Primary Residence Pivot needs your input to continue.', time: '3h ago', read: true },
  { id: 'n4', type: 'info',    title: 'Weekly Digest Ready', body: 'Your personalized decision summary for this week is available.', time: '1d ago', read: true },
];

const TYPE_META = {
  success: { icon: CheckCircle2, color: '#10B981' },
  info:    { icon: Info,         color: '#6366F1'  },
  warning: { icon: AlertTriangle,color: '#F59E0B'  },
};

export default function NotificationsDrawer({ open, onClose }) {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const overlayRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  function markRead(id) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="notif-drawer__backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside className="notif-drawer" role="dialog" aria-label="Notifications" aria-modal="true">
        <div className="notif-drawer__header">
          <div className="notif-drawer__header-left">
            <Bell size={18} strokeWidth={2} />
            <span className="notif-drawer__title">Notifications</span>
            {unreadCount > 0 && (
              <span className="notif-drawer__badge">{unreadCount}</span>
            )}
          </div>
          <div className="notif-drawer__header-actions">
            {unreadCount > 0 && (
              <button type="button" className="notif-drawer__mark-all" onClick={markAllRead}>
                <Check size={12} strokeWidth={2.5} />
                Mark all read
              </button>
            )}
            <button type="button" className="notif-drawer__close" onClick={onClose} aria-label="Close notifications">
              <X size={18} strokeWidth={2} />
            </button>
          </div>
        </div>

        <div className="notif-drawer__list">
          {notifications.length === 0 ? (
            <div className="notif-drawer__empty">
              <Bell size={36} strokeWidth={1.5} />
              <p>You're all caught up!</p>
            </div>
          ) : (
            notifications.map(n => {
              const { icon: Icon, color } = TYPE_META[n.type] || TYPE_META.info;
              return (
                <div
                  key={n.id}
                  className={`notif-drawer__item ${!n.read ? 'is-unread' : ''}`}
                  onClick={() => markRead(n.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && markRead(n.id)}
                  aria-label={n.title}
                >
                  <div className="notif-drawer__item-icon" style={{ '--notif-color': color }}>
                    <Icon size={16} strokeWidth={2} />
                  </div>
                  <div className="notif-drawer__item-body">
                    <p className="notif-drawer__item-title">{n.title}</p>
                    <p className="notif-drawer__item-text">{n.body}</p>
                    <span className="notif-drawer__item-time">{n.time}</span>
                  </div>
                  {!n.read && <span className="notif-drawer__unread-dot" aria-label="Unread" />}
                </div>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
}
