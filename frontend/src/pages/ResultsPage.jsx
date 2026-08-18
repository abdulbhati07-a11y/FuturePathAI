import { useEffect, useState, useRef, lazy, Suspense } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Globe, Lock, Download, Loader2, RotateCcw, ArrowLeft, Link2, Check, GitCompare } from 'lucide-react';
import PublicNav         from '../components/landing/PublicNav';
import ResultsHeader     from '../components/results/ResultsHeader';
import ProsConsPanel     from '../components/results/ProsConsPanel';
import PathTimeline      from '../components/results/PathTimeline';
import ExploredAlternatives from '../components/results/ExploredAlternatives';
import SiteFooter        from '../components/SiteFooter';
import { getSimulationResult, toggleSimulationPublic } from '../api/results';
import '../components/Skeleton.css';
import './ResultsPage.css';

// ScenarioComparison is the largest section of the report and is only needed
// once the data has loaded, so it stays out of the page's initial chunk.
const ScenarioComparison = lazy(() => import('../components/results/ScenarioComparison'));

export default function ResultsPage() {
  const { simulationId } = useParams();
  const navigate = useNavigate();

  const [result, setResult]       = useState(null);
  const [status, setStatus]       = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [isPublic, setIsPublic]   = useState(false);
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied]       = useState(false);

  // ── PDF export setup ───────────────────────────────────────────────────────
  // react-to-pdf (jsPDF + html2canvas, ~600 kB) is imported on demand inside
  // handleExportPDF so it never lands in the initial page chunk. We keep a
  // custom options object so the PDF is A4, has margins, and the filename
  // includes the report title once we have it.
  const targetRef = useRef(null);
  const pdfOptions = {
    method: 'save',
    filename: 'futurepath-report.pdf',   // overridden per-export below
    page: {
      margin: 12,          // mm
      format: 'A4',
      orientation: 'portrait',
    },
    canvas: {
      mimeType: 'image/png',
      qualityRatio: 1,
    },
    overrides: {
      pdf: {
        compress: true,
      },
      canvas: {
        useCORS: true,
        scale: 2,           // 2× for retina-quality output
        logging: false,
      },
    },
  };

  // ── Load report data ───────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await getSimulationResult(simulationId);
        if (!mounted) return;
        setResult(data);
        setIsPublic(data.isPublic ?? false);
        setStatus('ready');
      } catch (err) {
        if (!mounted) return;
        setErrorMessage(err.message || 'Could not load this report.');
        setStatus('error');
      }
    }
    load();
    return () => { mounted = false; };
  }, [simulationId]);

  // ── Export to PDF ──────────────────────────────────────────────────────────
  async function handleExportPDF() {
    if (exporting || !result) return;
    setExporting(true);

    // 1. Reveal pdf-only elements (watermark header/footer) and expand sections
    const container = targetRef.current;
    if (container) container.classList.add('pdf-capturing');
    window.dispatchEvent(new CustomEvent('pdf:expand-all'));

    // 2. Wait one tick for React to flush the DOM updates
    await new Promise(r => setTimeout(r, 150));

    try {
      const safeName = (result.title || 'report')
        .replace(/[^a-z0-9\s-]/gi, '')
        .replace(/\s+/g, '-')
        .toLowerCase()
        .slice(0, 60);

      // Lazy-load the PDF machinery only when the user actually exports.
      const { default: generatePDF } = await import('react-to-pdf');
      await generatePDF(targetRef, { ...pdfOptions, filename: `futurepath-${safeName}.pdf` });
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      // 3. Restore normal view
      if (container) container.classList.remove('pdf-capturing');
      window.dispatchEvent(new CustomEvent('pdf:collapse-all'));
      setExporting(false);
    }
  }

  // ── Toggle public / private ────────────────────────────────────────────────
  async function handleTogglePublic() {
    const next = !isPublic;
    setIsPublic(next);
    try {
      await toggleSimulationPublic(simulationId, next);
    } catch {
      setIsPublic(!next); // revert on failure
    }
  }

  // ── Copy share link ────────────────────────────────────────────────────────
  async function handleCopyLink() {
    const url = `${window.location.origin}/simulations/${simulationId}/results`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API blocked (e.g. insecure context) — fall back to a
      // temporary input + execCommand so sharing still works.
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      try { document.execCommand('copy'); } catch { /* no-op */ }
      input.remove();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="results-page">
        <PublicNav />
        <main className="results-page__main">
          <div className="results-page__skeleton">
            <div className="skeleton" style={{ height: 40, width: 200, borderRadius: 8 }} />
            <div className="skeleton" style={{ height: 120, borderRadius: 14 }} />
            <div className="skeleton skeleton-chart" style={{ height: 260 }} />
            <div className="results-page__skeleton-row">
              <div className="skeleton" style={{ height: 180, borderRadius: 14 }} />
              <div className="skeleton" style={{ height: 180, borderRadius: 14 }} />
            </div>
            <div className="skeleton" style={{ height: 160, borderRadius: 14 }} />
          </div>
        </main>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <div className="results-page">
        <PublicNav />
        <div className="results-page__center-state">
          <p className="results-page__error-msg">{errorMessage}</p>
          <p className="results-page__error-hint">
            Complete a simulation first to generate a report.
          </p>
          <button
            type="button"
            className="results-page__cta-btn"
            onClick={() => navigate('/app/simulations/new')}
          >
            Run a Simulation
          </button>
        </div>
      </div>
    );
  }

  // ── Ready ──────────────────────────────────────────────────────────────────
  return (
    <div className="results-page">
      <PublicNav />

      <main className="results-page__main">
        {/* ── Action bar ──────────────────────────────────────────────────── */}
        <div className="results-page__action-bar">
          {/* Back */}
          <button
            type="button"
            className="results-page__back-btn"
            onClick={() => navigate('/app/dashboard')}
          >
            <ArrowLeft size={14} strokeWidth={2} />
            Back to Dashboard
          </button>

          {/* Right actions */}
          <div className="results-page__actions">
            {/* Public toggle */}
            <button
              type="button"
              className={`results-page__toggle-btn ${isPublic ? 'is-public' : ''}`}
              onClick={handleTogglePublic}
              title={isPublic ? 'Make private' : 'Make public — share with community'}
            >
              {isPublic
                ? <><Globe size={14} strokeWidth={2} /> Public</>
                : <><Lock  size={14} strokeWidth={2} /> Private</>
              }
            </button>

            {/* Copy share link */}
            <button
              type="button"
              className={`results-page__copy-btn ${copied ? 'is-copied' : ''}`}
              onClick={handleCopyLink}
              title={isPublic
                ? 'Copy shareable link'
                : 'Copy link — make the report public so others can open it'}
            >
              {copied
                ? <><Check size={14} strokeWidth={2} /> Copied</>
                : <><Link2 size={14} strokeWidth={2} /> Copy link</>
              }
            </button>

            {/* Compare with another path */}
            <button
              type="button"
              className="results-page__compare-btn"
              onClick={() => navigate(`/app/simulations/compare?a=${simulationId}`)}
              title="Compare this path against another simulation"
            >
              <GitCompare size={14} strokeWidth={2} />
              Compare
            </button>

            {/* Re-run */}
            <button
              type="button"
              className="results-page__rerun-btn"
              onClick={() => navigate('/app/simulations/new')}
            >
              <RotateCcw size={14} strokeWidth={2} />
              Re-run
            </button>

            {/* Export PDF */}
            <button
              type="button"
              className="results-page__export-btn"
              onClick={handleExportPDF}
              disabled={exporting}
              title="Download as PDF"
            >
              {exporting
                ? <><Loader2 size={14} strokeWidth={2} className="results-page__spinner-sm" /> Exporting…</>
                : <><Download size={14} strokeWidth={2} /> Export PDF</>
              }
            </button>
          </div>
        </div>

        {/* ── PDF capture area ────────────────────────────────────────────── */}
        {/* Only content inside targetRef is included in the PDF.            */}
        {/* The PDF watermark header is visible only during PDF capture via  */}
        {/* the .pdf-only utility class.                                     */}
        <div ref={targetRef} className="results-page__report-container">
          {/* Watermark header — hidden on screen, visible in PDF */}
          <div className="results-page__pdf-header pdf-only">
            <span className="results-page__pdf-brand">FuturePath AI</span>
            <span className="results-page__pdf-meta">
              {result.title}
              {result.finalizedDate ? ` · Finalized ${result.finalizedDate}` : ' · Draft — not finalized'}
            </span>
          </div>

          <ResultsHeader
            title={result.title}
            date={result.finalizedDate}
            overallRisk={result.overallRisk}
            riskScore={result.riskScore}
            confidence={result.confidence}
            verdict={result.verdict}
            onRerun={() => navigate('/app/simulations/new')}
          />

          <Suspense fallback={<div className="skeleton skeleton-chart" style={{ height: 280 }} />}>
            <ScenarioComparison
              bestCase={result.bestCase}
              mostLikely={result.mostLikely}
              worstCase={result.worstCase}
            />
          </Suspense>

          <ProsConsPanel
            rightReasons={result.rightReasons}
            wrongReasons={result.wrongReasons}
            bestCase={result.bestCase}
            mostLikely={result.mostLikely}
            worstCase={result.worstCase}
            confidence={result.confidence}
          />

          <PathTimeline milestones={result.timeline} />

          <ExploredAlternatives alternatives={result.alternatives} />

          {/* PDF footer */}
          <div className="results-page__pdf-footer pdf-only">
            <span>© {new Date().getFullYear()} FuturePath AI — Confidential Report</span>
            <span>futurepathai.org</span>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
