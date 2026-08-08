import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Globe, User, Shield, ChevronRight, RefreshCw, AlertCircle, FileText } from 'lucide-react';
import { supabase } from '../api/supabase';
import './GalleryPage.css';

const MOCK_GALLERY = [
  { id: 'sim_1', title: 'Should I take the senior role in Berlin?', category: 'Career', authorName: 'Sarah C.', riskLevel: 'Low', updatedAt: '2024-10-24' },
  { id: 'sim_2', title: 'Series C Equity Liquidation Strategy',    category: 'Investment', authorName: 'James R.', riskLevel: 'Medium', updatedAt: '2024-10-12' },
  { id: 'sim_3', title: 'Should I move to Barcelona for lifestyle?', category: 'Relocation', authorName: 'Maria L.', riskLevel: 'Low', updatedAt: '2024-10-08' },
  { id: 'sim_4', title: 'Launching a SaaS bootstrapped vs funded', category: 'Business', authorName: 'Alex T.', riskLevel: 'High', updatedAt: '2024-09-30' },
  { id: 'sim_5', title: 'MBA vs on-the-job promotion — ROI',       category: 'Education', authorName: 'Priya K.', riskLevel: 'Low', updatedAt: '2024-09-22' },
  { id: 'sim_6', title: 'Early retirement at 45 — can I afford it?', category: 'Finance', authorName: 'Tom W.', riskLevel: 'Medium', updatedAt: '2024-09-15' },
];

const RISK_CLS = { Low: 'risk--low', Medium: 'risk--med', High: 'risk--high' };

export default function GalleryPage() {
  const navigate = useNavigate();
  const [simulations, setSimulations] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [search, setSearch]           = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('simulations')
        .select('*')
        .eq('is_public', true)
        .order('updated_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      setSimulations(data.length ? data : MOCK_GALLERY);
    } catch {
      // API may not have a public gallery endpoint yet — use mocks
      setSimulations(MOCK_GALLERY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = search.trim()
    ? simulations.filter(s =>
        s.title?.toLowerCase().includes(search.toLowerCase()) ||
        s.category?.toLowerCase().includes(search.toLowerCase())
      )
    : simulations;

  return (
    <div className="gallery-page">
      {/* Header */}
      <div className="gallery-page__header">
        <div className="gallery-page__header-icon">
          <Globe size={20} strokeWidth={2} />
        </div>
        <div className="gallery-page__header-text">
          <h1 className="gallery-page__title">Community Gallery</h1>
          <p className="gallery-page__subtitle">Explore simulations shared by the FuturePath AI community</p>
        </div>
        <button
          type="button"
          className="gallery-page__refresh"
          onClick={load}
          disabled={loading}
          aria-label="Refresh gallery"
        >
          <RefreshCw size={14} strokeWidth={2} className={loading ? 'spinning' : ''} />
        </button>
      </div>

      {/* Search */}
      <div className="gallery-page__search-row">
        <div className="gallery-page__search">
          <Search size={14} strokeWidth={2} />
          <input
            type="text"
            placeholder="Search simulations or categories…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="gallery-page__search-input"
            aria-label="Search gallery"
          />
        </div>
        <span className="gallery-page__count">
          {filtered.length} simulation{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Content */}
      {loading ? (
        <div className="gallery-page__skeletons">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="gallery-skeleton" />
          ))}
        </div>
      ) : error ? (
        <div className="gallery-page__error">
          <AlertCircle size={18} strokeWidth={2} />
          <span>{error}</span>
          <button type="button" onClick={load}>Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="gallery-page__empty">
          <FileText size={44} strokeWidth={1.3} />
          <p>No simulations match your search.</p>
          <button type="button" className="gallery-page__clear-btn" onClick={() => setSearch('')}>
            Clear search
          </button>
        </div>
      ) : (
        <div className="gallery-grid">
          {filtered.map(sim => (
            <button
              key={sim.id}
              type="button"
              className="gallery-card"
              onClick={() => navigate(`/simulations/${sim.id}/results`)}
            >
              <div className="gallery-card__top">
                <span className="gallery-card__category">{sim.category}</span>
                <span className="gallery-card__date">
                  {sim.updatedAt ? new Date(sim.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                </span>
              </div>

              <h3 className="gallery-card__title">{sim.title}</h3>

              <div className="gallery-card__meta">
                <span className="gallery-card__author">
                  <User size={12} strokeWidth={2} />
                  {sim.authorName || 'Anonymous'}
                </span>
                {sim.riskLevel && (
                  <span className={`gallery-card__risk ${RISK_CLS[sim.riskLevel] || ''}`}>
                    <Shield size={12} strokeWidth={2} />
                    Risk: {sim.riskLevel}
                  </span>
                )}
              </div>

              <div className="gallery-card__footer">
                <span>View Analysis</span>
                <ChevronRight size={15} strokeWidth={2} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
