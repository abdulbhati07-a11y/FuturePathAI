import { X, LayoutGrid, Home, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './SimulationHeader.css';

const PAGE_LINKS = [
  { label: 'Landing', icon: Home, path: '/' },
  { label: 'Dashboard', icon: LayoutGrid, path: '/app/dashboard' },
  { label: 'Report', icon: FileText, path: '/app/reports' },
];

export default function SimulationHeader({ currentStep, totalSteps, avatarUrl, onClose }) {
  const navigate = useNavigate();
  const progress = totalSteps > 0 ? Math.round((currentStep / totalSteps) * 100) : 0;

  return (
    <header className="simulation-header">
      <button type="button" className="simulation-header__close" onClick={onClose} aria-label="Close simulation">
        <X size={18} strokeWidth={2} />
      </button>

      <h1 className="simulation-header__title">FuturePath AI</h1>

      {/* Quick page links */}
      <nav className="simulation-header__pages" aria-label="Quick navigation">
        {PAGE_LINKS.map(({ label, icon: Icon, path }) => (
          <button
            key={path}
            type="button"
            className="simulation-header__page-link"
            onClick={() => navigate(path)}
            title={label}
          >
            <Icon size={14} strokeWidth={2} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="simulation-header__right">
        {/* Progress bar */}
        <div className="simulation-header__progress" title={`Step ${currentStep} of ${totalSteps}`}>
          <div className="simulation-header__progress-track">
            <div
              className="simulation-header__progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="simulation-header__step-label">
            {String(currentStep).padStart(2, '0')} / {String(totalSteps).padStart(2, '0')}
          </span>
        </div>

        <div className="simulation-header__avatar" aria-hidden={!avatarUrl}>
          {avatarUrl ? <img src={avatarUrl} alt="" /> : <span>U</span>}
        </div>
      </div>
    </header>
  );
}
