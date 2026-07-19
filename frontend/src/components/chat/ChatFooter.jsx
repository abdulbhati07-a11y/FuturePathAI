import { Sparkles, Pause } from 'lucide-react';
import './ChatFooter.css';

export function ThinkingIndicator() {
  return (
    <div className="thinking-indicator">
      <span className="thinking-indicator__icon">
        <Sparkles size={13} strokeWidth={2} />
      </span>
      <span>Analyzing procedural patterns…</span>
    </div>
  );
}

export function SavePauseBar({ onSave, saving }) {
  return (
    <button type="button" className="save-pause-bar" onClick={onSave} disabled={saving}>
      <Pause size={13} strokeWidth={2} />
      {saving ? 'Saving…' : 'Save Draft & Pause Simulation'}
    </button>
  );
}
