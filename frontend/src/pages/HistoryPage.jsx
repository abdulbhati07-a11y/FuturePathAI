import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, RefreshCw, ChevronLeft, ChevronRight, Clock, CheckCircle2, AlertCircle, FileText, X } from 'lucide-react';
import { apiClient } from '../api/client';
import './HistoryPage.css';

const STATUS_META = {
  COMPLETED:   { label: 'Completed',   icon: CheckCircle2, cls: 'status--completed' },
  IN_PROGRESS: { label: 'In Progress', icon: Clock,        cls: 'status--progress'  },
  DRAFT:       { label: 'Draft',       icon: FileText,     cls: 'status--draft'     },
  ARCHIVED:    { label: 'Archived',    icon: AlertCircle,  cls: 'status--archived'  },
};

const CATEGORIES = ['All', 'Career', 'Finance', 'Investment', 'Relocation', 'Business', 'Education', 'Lifestyle'];

export default function HistoryPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Read ?q= from URL on first mount (set by navbar search)
  const initialQuery = new URLSearchParams(location.search).get('q') ?? '';

  const [simulations, setSimulations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(initialQuery);
  const [category, setCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 8;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (category !== 'All') params.set('category', category);
      const raw = await apiClient.get(`/simulations?${params}`);
      const list = Array.isArray(raw) ? raw : (raw?.data ?? []);
      const meta = Array.isArray(raw) ? null : raw?.meta;
      setSimulations(list);
      setTotal(meta?.total ?? list.length);
    } catch (err) {
      setError(err.message || 'Failed to load simulations.');
    } finally {
      setLoading(false);
    }
  }, [page, category]);

  useEffect(() => { load(); }, [load]);

  // Keep URL in sync with current search query so back/forward works
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const currentQ = params.get('q') ?? '';
    if (search !== currentQ) {
      const newParams = new URLSearchParams();
      if (search) newParams.set('q', search);
      navigate(`/app/history${newParams.toString() ? `?${newParams}` : ''}`, { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const filtered = search.trim()
    ? simulations.filter(s => s.title?.toLowerCase().includes(search.toLowerCase()))
    : simulations;

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="history-page">
      {/* Header */}
      <div className="history-page__header">
        <div>
          <h1 className="history-page__title">Simulation History</h1>
          <p className="history-page__subtitle">{total} total simulations across all categories</p>
        </div>
        <button type="button" className="history-page__new-btn" onClick={() => navigate('/app/simulations/new')}>
          + New Simulation
        </button>
      </div>

      {/* Filters */}
      <div className="history-page__filters">
        <div className="history-page__search">
          <Search size={14} strokeWidth={2} />
          <input
            type="text"
            placeholder="Search simulations…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="history-page__search-input"
            aria-label="Search simulations"
            autoFocus={!!initialQuery}
          />
          {search && (
            <button
              type="button"
              className="history-page__search-clear"
              aria-label="Clear search"
              onClick={() => { setSearch(''); setPage(1); navigate('/app/history', { replace: true }); }}
            >
              <X size={13} strokeWidth={2.5} />
            </button>
          )}
        </div>

        <div className="history-page__cats">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              className={`history-page__cat-btn ${category === cat ? 'is-active' : ''}`}
              onClick={() => { setCategory(cat); setPage(1); }}
            >
              {cat}
            </button>
          ))}
        </div>

        <button type="button" className="history-page__refresh-btn" onClick={load} aria-label="Refresh">
          <RefreshCw size={14} strokeWidth={2} className={loading ? 'spinning' : ''} />
        </button>
      </div>

      {/* Active search banner */}
      {search.trim() && (
        <div className="history-page__search-banner">
          <Search size={14} strokeWidth={2} />
          Showing results for <strong>"{search.trim()}"</strong>
          {filtered.length > 0 && (
            <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>
              &nbsp;— {filtered.length} match{filtered.length !== 1 ? 'es' : ''}
            </span>
          )}
          <button
            type="button"
            className="history-page__search-banner-clear"
            onClick={() => {
              setSearch('');
              setPage(1);
              navigate('/app/history', { replace: true });
            }}
          >
            Clear search ✕
          </button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="history-page__skeletons">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="history-skeleton" />
          ))}
        </div>
      ) : error ? (
        <div className="history-page__error">
          <AlertCircle size={18} strokeWidth={2} />
          <span>{error}</span>
          <button type="button" onClick={load}>Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="history-page__empty">
          <FileText size={40} strokeWidth={1.5} />
          <p>No simulations found.</p>
          <button type="button" className="history-page__new-btn" onClick={() => navigate('/app/simulations/new')}>
            Start Your First Simulation
          </button>
        </div>
      ) : (
        <>
          <div className="history-table">
            <div className="history-table__head">
              <span>Simulation</span>
              <span>Category</span>
              <span>Status</span>
              <span>Risk</span>
              <span>Confidence</span>
              <span>Updated</span>
              <span />
            </div>

            {filtered.map(sim => {
              const meta = STATUS_META[sim.status] || STATUS_META.DRAFT;
              const StatusIcon = meta.icon;
              const riskScore = sim.riskScore ?? sim.riskPercent ?? 0;
              const riskLevel = riskScore < 30 ? 'Low' : riskScore < 70 ? 'Med' : 'High';
              const riskCls = riskScore < 30 ? 'risk--low' : riskScore < 70 ? 'risk--med' : 'risk--high';

              return (
                <div key={sim.id} className="history-table__row">
                  <div className="history-table__title">
                    <span className="history-table__name">{sim.title}</span>
                  </div>
                  <span className="history-table__cat">{sim.category}</span>
                  <span className={`history-table__status ${meta.cls}`}>
                    <StatusIcon size={12} strokeWidth={2.5} />
                    {meta.label}
                  </span>
                  <span className={`history-table__risk ${riskCls}`}>
                    {riskLevel} <span className="history-table__risk-pct">({riskScore}%)</span>
                  </span>
                  <div className="history-table__conf">
                    <div className="history-table__conf-bar">
                      <span style={{ width: `${sim.confidenceScore ?? 0}%` }} />
                    </div>
                    <span>{sim.confidenceScore ?? 0}%</span>
                  </div>
                  <span className="history-table__date">
                    {sim.updatedAt ? new Date(sim.updatedAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </span>
                  <button
                    type="button"
                    className="history-table__action"
                    onClick={() => navigate(`/simulations/${sim.id}/results`)}
                  >
                    View
                  </button>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="history-page__pagination">
              <button
                type="button"
                className="history-page__page-btn"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft size={15} strokeWidth={2.5} />
              </button>
              <span className="history-page__page-info">Page {page} of {totalPages}</span>
              <button
                type="button"
                className="history-page__page-btn"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronRight size={15} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
