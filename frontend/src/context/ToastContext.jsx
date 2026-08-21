/**
 * ToastContext — global toast system for FuturePath AI.
 *
 * Usage:
 *   const { toast } = useToast();
 *   toast('Profile saved!');
 *   toast('Something went wrong', { type: 'error' });
 *   toast('Download started', { type: 'info', duration: 4000 });
 *
 * Toast types:  'success' | 'error' | 'warning' | 'info'
 * Options:      { type, duration, icon }
 */

import {
  createContext, useContext, useState, useCallback, useRef,
} from 'react';
import {
  CheckCircle2, XCircle, AlertTriangle, Info, X,
} from 'lucide-react';
import './Toast.css';

/* ── Context ─────────────────────────────────────────────────────────────── */
const ToastContext = createContext(null);

const DEFAULT_DURATION = 3500;

const TYPE_META = {
  success: { icon: CheckCircle2, cls: 'toast--success' },
  error:   { icon: XCircle,      cls: 'toast--error'   },
  warning: { icon: AlertTriangle,cls: 'toast--warning'  },
  info:    { icon: Info,         cls: 'toast--info'     },
};

/* ── Provider ────────────────────────────────────────────────────────────── */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counterRef = useRef(0);

  const dismiss = useCallback((id) => {
    // Mark as leaving first (triggers exit animation), then remove
    setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 280); // matches CSS exit animation duration
  }, []);

  const toast = useCallback((message, options = {}) => {
    const {
      type     = 'success',
      duration = DEFAULT_DURATION,
      icon     = null,
    } = options;

    const id = ++counterRef.current;

    setToasts(prev => [
      ...prev.slice(-4), // cap at 5 visible toasts
      { id, message, type, icon, leaving: false },
    ]);

    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }

    return id;
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

/* ── Hook ────────────────────────────────────────────────────────────────── */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

/* ── Toast container ─────────────────────────────────────────────────────── */
function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-container" role="region" aria-label="Notifications" aria-live="polite">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

/* ── Single toast ────────────────────────────────────────────────────────── */
function ToastItem({ toast, onDismiss }) {
  const meta = TYPE_META[toast.type] ?? TYPE_META.info;
  const Icon = toast.icon ?? meta.icon;

  return (
    <div
      className={`toast ${meta.cls} ${toast.leaving ? 'toast--leaving' : ''}`}
      role="status"
      aria-atomic="true"
    >
      <span className="toast__icon">
        <Icon size={15} strokeWidth={2.5} />
      </span>
      <span className="toast__message">{toast.message}</span>
      <button
        type="button"
        className="toast__close"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
      >
        <X size={13} strokeWidth={2.5} />
      </button>
    </div>
  );
}
