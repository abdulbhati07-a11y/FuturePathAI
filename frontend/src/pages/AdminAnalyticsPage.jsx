import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { cssVar } from '../utils/cssVar';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import './AdminAnalyticsPage.css';

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="admin__stat-card" style={{ borderTopColor: accent }}>
      <span className="admin__stat-value">{value ?? '—'}</span>
      <span className="admin__stat-label">{label}</span>
      {sub && <span className="admin__stat-sub">{sub}</span>}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  const isAdmin = user?.roles?.includes('ADMIN') || user?.role === 'ADMIN';

  useEffect(() => {
    if (!isAdmin) { setStatus('forbidden'); return; }

    async function load() {
      try {
        const [simsRaw, usersRaw] = await Promise.all([
          apiClient.get('/simulations?limit=500'),
          apiClient.get('/admin/users'),
        ]);
        const sims = Array.isArray(simsRaw) ? simsRaw : (simsRaw?.data ?? []);
        const usersData = Array.isArray(usersRaw) ? usersRaw : (usersRaw?.data ?? []);
        const totalSims = sims.length;
        const completed = sims.filter(s => s.status === 'COMPLETED').length;
        const avgRisk = totalSims ? Math.round(sims.reduce((a, s) => a + (s.riskScore || 0), 0) / totalSims) : 0;
        setAnalytics({ totalSimulations: totalSims, completedSimulations: completed, averageRisk: avgRisk, totalUsers: usersData.length });
        setUsers(usersData);
        setStatus('ready');
      } catch (err) {
        setError(err.message || 'Failed to load admin data.');
        setStatus('error');
      }
    }

    load();
  }, [isAdmin]);

  if (status === 'forbidden') {
    return (
      <div className="admin__forbidden">
        <span style={{ fontSize: '3rem' }}>🔒</span>
        <h2>Admin access required</h2>
        <p>Your account does not have the ADMIN role.</p>
        <button onClick={() => navigate('/app/dashboard')}>Go to Dashboard</button>
      </div>
    );
  }

  if (status === 'loading') return <div className="admin__loading">Loading analytics…</div>;

  if (status === 'error') {
    return (
      <div className="admin__forbidden">
        <p>⚠️ {error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  // Normalise analytics shape — backend may vary
  const stats = analytics?.stats ?? analytics ?? {};
  const simsByDay = analytics?.simulationsByDay ?? analytics?.byDay ?? [];
  const simsByCategory = analytics?.simulationsByCategory ?? analytics?.byCategory ?? [];

  // Recharts SVG props need a real colour at runtime (a `var()` won't paint),
  // so read the brand primary from the active theme.
  const chartColor = cssVar('--color-primary');

  return (
    <div className="admin">
      <div className="admin__header">
        <h1 className="admin__title">Admin Analytics</h1>
        <span className="admin__badge">ADMIN</span>
      </div>

      {/* ── Platform stats ────────────────────────────────── */}
      <div className="admin__stats-grid">
        <StatCard label="Total Users" value={stats.totalUsers} accent="var(--color-primary)" />
        <StatCard label="Total Simulations" value={stats.totalSimulations} accent="var(--color-success)" />
        <StatCard label="Reports Generated" value={stats.totalReports} accent="var(--color-warning)" />
        <StatCard label="Premium Users" value={stats.premiumUsers} accent="var(--color-secondary)"
          sub={stats.totalUsers ? `${Math.round((stats.premiumUsers / stats.totalUsers) * 100)}% conversion` : null}
        />
      </div>

      {/* ── Charts ───────────────────────────────────────── */}
      <div className="admin__charts">
        {simsByDay.length > 0 && (
          <div className="admin__chart-card">
            <h3>Simulations per Day</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={simsByDay} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#1e1e2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Line type="monotone" dataKey="count" stroke={chartColor} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {simsByCategory.length > 0 && (
          <div className="admin__chart-card">
            <h3>Simulations by Category</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={simsByCategory} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <XAxis dataKey="category" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#1e1e2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Bar dataKey="count" fill={chartColor} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Recent users table ───────────────────────────── */}
      {users.length > 0 && (
        <div className="admin__users-card">
          <h3>Recent Users</h3>
          <div className="admin__table-wrap">
            <table className="admin__table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Simulations</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.firstName} {u.lastName}</td>
                    <td className="admin__email">{u.email}</td>
                    <td>
                      <span className={`admin__role-badge admin__role-badge--${(u.role || 'free').toLowerCase()}`}>
                        {u.role || 'FREE'}
                      </span>
                    </td>
                    <td>{u._count?.simulations ?? u.simulationCount ?? '—'}</td>
                    <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
