import { Component } from 'react';

/**
 * ErrorBoundary — catches render errors anywhere in the subtree below it.
 *
 * Props:
 *   fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode)
 *   children: ReactNode
 *
 * Usage:
 *   <ErrorBoundary>
 *     <SomePage />
 *   </ErrorBoundary>
 *
 *   <ErrorBoundary fallback={(err, reset) => <MyFallback error={err} onRetry={reset} />}>
 *     <HeavyComponent />
 *   </ErrorBoundary>
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.reset = this.reset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, { componentStack }) {
    console.error('[ErrorBoundary] Uncaught error:', error.message, componentStack);
  }

  reset() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    const { hasError, error } = this.state;
    const { fallback, children } = this.props;

    if (!hasError) return children;
    if (typeof fallback === 'function') return fallback(error, this.reset);
    if (fallback) return fallback;

    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: '240px', padding: '2rem', gap: '1rem',
        color: 'var(--text-primary, #f1f5f9)',
        background: 'var(--bg-card, rgba(255,255,255,0.04))',
        borderRadius: '12px',
        border: '1px solid rgba(239,68,68,0.25)',
        margin: '1.5rem',
      }}>
        <span style={{ fontSize: '2.5rem' }}>⚠️</span>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
          Something went wrong
        </h3>
        <p style={{
          margin: 0, fontSize: '0.82rem',
          color: 'var(--text-secondary, #94a3b8)',
          textAlign: 'center', maxWidth: '340px',
        }}>
          {error?.message || 'An unexpected error occurred in this section.'}
        </p>
        <button
          onClick={this.reset}
          style={{
            padding: '0.5rem 1.25rem', borderRadius: '8px',
            border: '1px solid rgba(99,102,241,0.5)',
            background: 'rgba(99,102,241,0.15)',
            color: '#a5b4fc', cursor: 'pointer', fontSize: '0.82rem',
          }}
        >
          Try again
        </button>
      </div>
    );
  }
}
