import { toText, toArray } from './reportContent';
import './PathTimeline.css';

export default function PathTimeline({ milestones }) {
  const list = toArray(milestones);
  return (
    <section className="path-timeline">
      <h3 className="path-timeline__heading">Path Trajectory Timeline</h3>
      <div className="path-timeline__track">
        <div className="path-timeline__line" />
        {list.map((m, i) => {
          const label = typeof m === 'string' ? m : toText(m, ['label', 'title', 'year', 'phase']);
          const sublabel = typeof m === 'string' ? '' : toText(m, ['sublabel', 'description', 'event', 'detail']);
          return (
            <div key={m?.id ?? i} className={`path-timeline__point ${i === 0 ? 'is-active' : ''}`}>
              <span className="path-timeline__dot" />
              <span className="path-timeline__label">{label}</span>
              <span className="path-timeline__sublabel">{sublabel}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
