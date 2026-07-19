import { Bell, Plus, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './WelcomeHeader.css';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function WelcomeHeader({ firstName, onNotificationsClick, onNewSimulation }) {
  const { user } = useAuth();

  // Prefer auth context name; fall back to prop; final fallback 'there'
  const displayName = user?.firstName
    || user?.name?.split(' ')[0]
    || firstName
    || 'there';

  const isPremium = user?.roles?.includes('PREMIUM') || user?.roles?.includes('ADMIN');

  const initials = user?.name
    ? user.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
    : displayName[0]?.toUpperCase() ?? 'U';

  return (
    <header className="welcome-header">
      <div className="welcome-header__left">
        <div className="welcome-header__greeting-row">
          <h1 className="welcome-header__title">
            {getGreeting()}, <span className="welcome-header__name">{displayName}</span> 👋
          </h1>
          {isPremium && (
            <span className="welcome-header__premium-badge">
              <Sparkles size={10} strokeWidth={2} />
              Premium
            </span>
          )}
        </div>
        <p className="welcome-header__sub">
          Here's your decision intelligence overview —{' '}
          <span className="welcome-header__date">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
        </p>
      </div>

      <div className="welcome-header__actions">
        <button
          type="button"
          className="welcome-header__new-btn"
          onClick={onNewSimulation}
        >
          <Plus size={15} strokeWidth={2.5} />
          New Simulation
        </button>

        <button
          type="button"
          className="welcome-header__icon-btn"
          aria-label="Notifications"
          onClick={onNotificationsClick}
        >
          <Bell size={17} strokeWidth={2} />
          <span className="welcome-header__notif-dot" aria-hidden="true" />
        </button>

        <div className="welcome-header__avatar" aria-hidden="true">
          {initials}
        </div>
      </div>
    </header>
  );
}
