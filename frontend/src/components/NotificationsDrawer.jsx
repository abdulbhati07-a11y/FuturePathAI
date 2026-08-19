import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Bell, CheckCircle2, Info, AlertTriangle, Check, Loader2 } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import './NotificationsDrawer.css';

const TYPE_META = {
  success: { icon: CheckCircle2, color: 'var(--color-success)' },
  info:    { icon: Info,         color: 'var(--color-primary)' },
  warning: { icon: AlertTriangle,color: 'var(--color-warning)' },
};

export default function NotificationsDrawer({ open, onClose }) {
  const navigate = useNavigate();
  // Same hook as AppNavbar, so the badge here and the badge up there are always
  // the same number — they used to be two independent hardcoded arrays.
  const { items: notifications, unreadCount, loading, error, markRead, markAllRead } = useNotifications();

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

  function openNotification(n) {
    markRead(n.id);
    if (n.href) { onClose(); navigate(n.href); }
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
          {loading ? (
            <div className="notif-drawer__empty">
              <Loader2 size={30} strokeWidth={1.5} className="spinning" />
              <p>Loading your activity…</p>
            </div>
          ) : error ? (
            /* Distinguish "nothing happened" from "we could not find out". */
            <div className="notif-drawer__empty">
              <AlertTriangle size={32} strokeWidth={1.5} />
              <p>{error}</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="notif-drawer__empty">
              <Bell size={36} strokeWidth={1.5} />
              <p>No activity yet.</p>
              <p className="notif-drawer__empty-sub">
                Run a simulation and its report will show up here.
              </p>
            </div>
          ) : (
            notifications.map(n => {
              const { icon: Icon, color } = TYPE_META[n.type] || TYPE_META.info;
              return (
                <div
                  key={n.id}
                  className={`notif-drawer__item ${!n.read ? 'is-unread' : ''}`}
                  onClick={() => openNotification(n)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && openNotification(n)}
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
