import { useEffect, useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WelcomeHeader        from '../components/WelcomeHeader';
import RecentSimulations    from '../components/RecentSimulations';
import AdvisorPanel         from '../components/AdvisorPanel';
import NotificationsDrawer  from '../components/NotificationsDrawer';
import DashboardOnboarding  from '../components/DashboardOnboarding';
import { getDashboardSummary, getRecentSimulations } from '../api/dashboard';
import '../components/Skeleton.css';
import './DashboardPage.css';

// Recharts (~500 kB) lives only inside these two components. Loading them
// lazily keeps the chart library out of the dashboard's initial chunk, so the
// shell + skeleton paint immediately and the charts stream in afterwards.
const SpotlightHero = lazy(() => import('../components/SpotlightHero'));
const StatsGrid     = lazy(() => import('../components/StatsGrid'));

/* Skeleton rows shown while loading */
function DashboardSkeleton() {
  return (
    <div className="dashboard-skeleton">
      <div className="dashboard-skeleton__header skeleton" />
      <div className="dashboard-skeleton__stats">
        {[0,1,2,3].map(i => <div key={i} className="dashboard-skeleton__stat-card skeleton" />)}
      </div>
      <div className="dashboard-skeleton__sims">
        {[0,1].map(i => <div key={i} className="dashboard-skeleton__sim-row skeleton" />)}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  // Use the authenticated user from context — no extra API call needed
  const { user: authUser } = useAuth();

  const [summary, setSummary]         = useState(null);
  const [simulations, setSimulations] = useState([]);
  const [status, setStatus]           = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [notifOpen, setNotifOpen]     = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        const [summaryData, simsData] = await Promise.all([
          getDashboardSummary(),
          getRecentSimulations(),
        ]);

        if (!isMounted) return;
        setSummary(summaryData);
        setSimulations(simsData);
        setStatus('ready');
      } catch (err) {
        if (!isMounted) return;
        setErrorMessage(err.message || 'Something went wrong loading the dashboard.');
        setStatus('error');
      }
    }

    loadDashboard();

    // A `realTimeSimulation.subscribe(...)` / `.start()` pair used to live here,
    // pushing a fresh set of Math.random() figures into state every two seconds.
    // Nothing about this data changes without the user running a simulation, so
    // there is nothing to subscribe to: it loads once, like the rest of the page.
    return () => { isMounted = false; };
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

  const stats   = summary?.stats ?? null;
  const totals  = summary?.totals ?? { simulations: 0, reports: 0, scored: 0, unfinished: 0 };

  // Is this a new user with no simulations yet? `totals` counts every row, not
  // just the five most recent ones this page lists.
  const isNewUser = totals.simulations === 0;

  // A simulation with no finished report carries no scores, so there is no
  // headline figure and no series to plot. The hero and the stat cards both
  // render nothing in that case — this is what goes in their place.
  const nothingScored = !isNewUser && totals.scored === 0;

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
          /* ── Returning user — spotlight hero + content ────────────────── */
          <>
            {nothingScored ? (
              <div className="dashboard-page__notice">
                <p className="dashboard-page__notice-title">No analysed paths yet</p>
                <p className="dashboard-page__notice-body">{summary?.advisor?.message}</p>
                <button type="button" onClick={() => navigate('/app/history')}>
                  Open your simulations
                </button>
              </div>
            ) : (
              <Suspense fallback={<div className="skeleton skeleton-chart" style={{ height: 220 }} />}>
                <SpotlightHero
                  stats={stats}
                  advisor={summary?.advisor}
                  onDeepDive={() => navigate('/app/advisor')}
                />
              </Suspense>
            )}

            {/* The strongest path is featured in the SpotlightHero above, so its
                card is hidden here to avoid printing the same figure twice. */}
            <Suspense fallback={
              <div className="dashboard-skeleton__stats" style={{ marginTop: '1.5rem' }}>
                {[0,1,2].map(i => <div key={i} className="dashboard-skeleton__stat-card skeleton" />)}
              </div>
            }>
              <StatsGrid stats={stats} exclude={['strongest']} />
            </Suspense>

            <div className="dashboard-page__grid">
              <div className="dashboard-page__grid-main">
                <RecentSimulations
                  simulations={simulations}
                  onViewAll={() => navigate('/app/history')}
                  onReview={(id) => navigate(`/simulations/${id}/results`)}
                  onStart={() => navigate('/app/simulations/new')}
                />
              </div>

              <div className="dashboard-page__grid-side">
                <AdvisorPanel
                  advisor={summary?.advisor}
                  categories={summary?.categories}
                  totals={totals}
                  lastActivityAt={summary?.lastActivityAt}
                  onDeepDive={() => navigate('/app/advisor')}
                />
              </div>
            </div>
          </>
        )}
      </main>

      <NotificationsDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  );
}
