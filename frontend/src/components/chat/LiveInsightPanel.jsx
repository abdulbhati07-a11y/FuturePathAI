import { Sparkles, TrendingUp } from 'lucide-react';
import './LiveInsightPanel.css';

export default function LiveInsightPanel({ insight }) {
  if (!insight) return null;

  return (
    <aside className="live-insight" aria-live="polite" aria-label="Live path insight">
      <div className="live-insight__heading">
        <span className="live-insight__dot" />
        <Sparkles size={13} strokeWidth={2} />
        <span>{insight.label || 'LIVE PATH INSIGHT'}</span>
      </div>
      <p className="live-insight__message">{insight.message}</p>
      <div className="live-insight__footer">
        <TrendingUp size={11} strokeWidth={2} />
        <span>Updating in real-time</span>
      </div>
    </aside>
  );
}
