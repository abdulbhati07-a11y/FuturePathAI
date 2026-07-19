import './PathTimeline.css';

export default function PathTimeline({ milestones }) {
  return (
    <section className="path-timeline">
      <h3 className="path-timeline__heading">Path Trajectory Timeline</h3>
      <div className="path-timeline__track">
        <div className="path-timeline__line" />
        {milestones.map((m, i) => (
          <div key={m.id} className={`path-timeline__point ${i === 0 ? 'is-active' : ''}`}>
            <span className="path-timeline__dot" />
            <span className="path-timeline__label">{m.label}</span>
            <span className="path-timeline__sublabel">{m.sublabel}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
