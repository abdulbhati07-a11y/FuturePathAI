import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WelcomeHeader        from '../components/WelcomeHeader';
import StatsGrid            from '../components/StatsGrid';
import RecentSimulations    from '../components/RecentSimulations';
import AdvisorPanel         from '../components/AdvisorPanel';
import NotificationsDrawer  from '../components/NotificationsDrawer';
import DashboardOnboarding  from '../components/DashboardOnboarding';
import {
  getDashboardStats,
  getRecentSimulations,
  getAdvisorInsight,
  getMarketCorrelation,
  getSystemMeta,
} from '../api/dashboard';
import { realTimeSimulation } from '../services/realTimeSimulation';
import './DashboardPage.css';

/* Skeleton rows shown while loading */
function DashboardSkeleton() {
  return (
    <div className="dashboard-skeleton">
      <div className="dashboard-skeleton__header" />
      <div className="dashboard-skeleton__stats">
        {[0,1,2,3].map(i => <div key={i} className="dashboard-skeleton__stat-card" />)}
      </div>
      <div className="dashboard-skeleton__sims">
        {[0,1].map(i => <div key={i} className="dashboard-skeleton__sim-row" />)}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  // Use the authenticated user from context — no extra API call needed
  const { user: authUser } = useAuth();

  const [stats, setStats]             = useState(null);
  const [simulations, setSimulations] = useState([]);
  const [advisor, setAdvisor]         = useState(null);
  const [correlations, setCorrelations] = useState([]);
  const [meta, setMeta]               = useState(null);
  const [status, setStatus]           = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [notifOpen, setNotifOpen]     = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        const [statsData, simsData, advisorData, correlationData, metaData] =
          await Promise.all([
            getDashboardStats(),
            getRecentSimulations(),
            getAdvisorInsight(),
            getMarketCorrelation(),
            getSystemMeta(),
          ]);

        if (!isMounted) return;
        setStats(statsData);
        setSimulations(simsData);
        setAdvisor(advisorData);
        setCorrelations(correlationData);
        setMeta(metaData);
        setStatus('ready');
      } catch (err) {
        if (!isMounted) return;
        setErrorMessage(err.message || 'Something went wrong loading the dashboard.');
        setStatus('error');
      }
    }

    loadDashboard();

    // Subscribe to real-time updates
    const unsubscribe = realTimeSimulation.subscribe((data) => {
      if (!isMounted) return;
      setStats(data.stats);
      setAdvisor(data.advisor);
      setCorrelations(data.correlations);
      setMeta(data.meta);
    });

    return () => { 
      isMounted = false; 
      unsubscribe();
      realTimeSimulation.stop();
    };
  }, []);

  if (status === 'loading') {
    return (
      <main className="dashboard-page">
        <DashboardSkeleton />
      </main>
    );
  }

  if (status === 'error') {
    return (
      <main className="dashboard-page">
        <div className="dashboard-page__error-banner">
          <p>⚠ Couldn't load dashboard data: {errorMessage}</p>
          <button type="button" onClick={() => window.location.reload()}>Retry</button>
        </div>
      </main>
    );
  }

  // Derive display name from auth context
  const firstName = authUser?.firstName
    || authUser?.name?.split(' ')[0]
    || 'there';

  // Is this a new user with no simulations yet?
  const isNewUser = simulations.length === 0;

  return (
    <div className="dashboard-page">
      <main className="dashboard-page__main">
        <WelcomeHeader
          firstName={firstName}
          onNewSimulation={() => navigate('/app/simulations/new')}
          onNotificationsClick={() => setNotifOpen(true)}
        />

        {isNewUser ? (
          /* ── Empty / onboarding state ─────────────────────────────────── */
          <DashboardOnboarding
            firstName={firstName}
            onStart={() => navigate('/app/simulations/new')}
          />
        ) : (
          /* ── Returning user — normal dashboard ────────────────────────── */
          <>
            <StatsGrid stats={stats} />
            <RecentSimulations
              simulations={simulations}
              onViewAll={() => navigate('/app/history')}
              onReview={(id) => navigate(`/simulations/${id}/results`)}
              onStart={() => navigate('/app/simulations/new')}
            />
          </>
        )}
      </main>

      {/* Advisor panel — shown only when user has data */}
      {!isNewUser && (
        <AdvisorPanel
          advisor={advisor}
          correlations={correlations}
          meta={meta}
          onDeepDive={() => navigate('/app/advisor')}
        />
      )}

      <NotificationsDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  );
}
