/**
 * AboutPage — public /about.
 *
 * Everything stated here is checkable against the product itself: what the
 * simulation actually does, and how it behaves when it does not know something.
 * Deliberately no invented company facts — no team size, no funding, no founding
 * date, no customer counts — because this page sits next to the legal pages and a
 * plausible-sounding number is the one kind of content this codebase has spent its
 * whole review cycle removing.
 */

import { useNavigate } from 'react-router-dom';
import {
  MessagesSquare, GitBranch, FileText,
  ShieldCheck, Scale, EyeOff, ArrowRight, Mail,
} from 'lucide-react';
import PublicNav from '../components/landing/PublicNav';
import SiteFooter from '../components/SiteFooter';
import './AboutPage.css';

const STEPS = [
  {
    icon: MessagesSquare,
    title: 'An interview, not a form',
    body: 'You talk through the decision with the AI in plain language — the offer, the numbers, what you are actually worried about. There is no fixed questionnaire, so the questions follow your situation instead of a template.',
  },
  {
    icon: GitBranch,
    title: 'Three futures, weighted',
    body: 'Your answers are projected into a best case, a most likely case and a worst case, each with a probability, a financial delta and a satisfaction estimate. The three probabilities are normalised so they describe one coherent distribution.',
  },
  {
    icon: FileText,
    title: 'A report you can argue with',
    body: 'You get a decision score, a risk score and a confidence score, plus a timeline and alternatives you may not have weighed. Confidence is driven by how much you actually told us — a thin interview produces a visibly low-confidence report rather than a falsely certain one.',
  },
];

const PRINCIPLES = [
  {
    icon: EyeOff,
    title: 'A blank is a blank',
    body: 'When the model does not return a figure, you see a dash — never a zero dressed up as a forecast. An unanswered question is not the same as an answer of "none", and the interface refuses to blur that line.',
  },
  {
    icon: Scale,
    title: 'Grounded, then scored',
    body: 'Salary deltas, timelines and cost figures are sanity-checked against real-world ranges before they reach a score, so an implausible number gets flagged rather than quietly compounded into the result.',
  },
  {
    icon: ShieldCheck,
    title: 'Your simulations are yours',
    body: 'Reports are private to your account unless you explicitly share one. Nothing you run is sold on, and a shared link exposes only the simulation you chose to share.',
  },
];

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="about-page">
      <PublicNav />

      <main className="about-page__main">
        {/* ── Hero ───────────────────────────────────────────────── */}
        <section className="about-page__hero">
          <p className="about-page__eyebrow">About FuturePath AI</p>
          <h1 className="about-page__title">
            Big decisions deserve better than a gut feeling.
          </h1>
          <p className="about-page__lede">
            Most of the choices that shape a life — taking the offer, moving cities,
            leaving the safe job, selling the equity — get made on a mix of instinct
            and whichever advice arrived most recently. FuturePath AI exists to give
            that moment some structure: an interview that draws out what actually
            matters to you, and a scored projection of where each path plausibly leads.
          </p>
        </section>

        {/* ── Mission ────────────────────────────────────────────── */}
        <section className="about-page__band">
          <h2 className="about-page__band-title">What we are trying to do</h2>
          <p className="about-page__band-body">
            Not predict your future — nobody can, and any product claiming otherwise is
            selling you certainty it does not have. The useful thing is narrower and
            more honest: make the trade-offs explicit, put a number on the risk you are
            taking, and show you the case you have not thought about yet. A good
            simulation does not tell you what to do. It tells you what you are choosing
            between, clearly enough that the decision becomes yours to make on purpose.
          </p>
        </section>

        {/* ── How it works ───────────────────────────────────────── */}
        <section className="about-page__section">
          <h2 className="about-page__section-title">How a simulation works</h2>
          <div className="about-page__grid">
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <article key={title} className="about-page__card">
                <div className="about-page__card-head">
                  <span className="about-page__card-icon">
                    <Icon size={17} strokeWidth={2} />
                  </span>
                  <span className="about-page__card-step">Step {i + 1}</span>
                </div>
                <h3 className="about-page__card-title">{title}</h3>
                <p className="about-page__card-body">{body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ── Principles ─────────────────────────────────────────── */}
        <section className="about-page__section">
          <h2 className="about-page__section-title">What we refuse to do</h2>
          <p className="about-page__section-sub">
            A decision tool is only worth using if you can trust the numbers it shows
            you. These are the rules the product is built to keep.
          </p>
          <div className="about-page__grid">
            {PRINCIPLES.map(({ icon: Icon, title, body }) => (
              <article key={title} className="about-page__card">
                <span className="about-page__card-icon about-page__card-icon--plain">
                  <Icon size={17} strokeWidth={2} />
                </span>
                <h3 className="about-page__card-title">{title}</h3>
                <p className="about-page__card-body">{body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ── Founder ────────────────────────────────────────────── */}
        <section className="about-page__section">
          <h2 className="about-page__section-title">Who built this</h2>
          <article className="about-page__founder">
            <div className="about-page__founder-avatar" aria-hidden="true">MA</div>
            <div className="about-page__founder-body">
              <h3 className="about-page__founder-name">Muhammad Abdullah Bhatti</h3>
              <p className="about-page__founder-role">Founder</p>
              <p className="about-page__founder-bio">
                FuturePath AI started as a personal problem. Muhammad Abdullah Bhatti
                kept watching capable people make irreversible decisions with less
                analysis than they would put into buying a laptop — not from
                carelessness, but because no tool existed that took a messy, personal
                situation and gave back something structured enough to reason about.
              </p>
              <p className="about-page__founder-bio">
                He built FuturePath AI to close that gap, and it is built on one
                stubborn conviction: a tool that invents a confident-looking number is
                worse than one that admits it does not know. That is why the product
                shows you a dash instead of a zero, tells you how much evidence a score
                is standing on, and would rather look uncertain than be quietly wrong.
              </p>
              <div className="about-page__founder-links">
                {/* Points at the real inquiry form on the landing page. No mailto and
                    no placeholder social profile: futurepathai.org mail is not set up
                    yet, and a link that silently goes nowhere is the same defect as a
                    fabricated number. */}
                <a className="about-page__founder-link" href="/#about">
                  <Mail size={14} strokeWidth={2} />
                  Get in touch
                </a>
              </div>
            </div>
          </article>
        </section>

        {/* ── CTA ────────────────────────────────────────────────── */}
        <section className="about-page__cta">
          <h2 className="about-page__cta-title">Have a decision on your desk?</h2>
          <p className="about-page__cta-body">
            Run it through a simulation and see the three cases side by side.
          </p>
          <button
            type="button"
            className="about-page__cta-btn"
            onClick={() => navigate('/app/simulations/new')}
          >
            Start a simulation
            <ArrowRight size={15} strokeWidth={2.5} />
          </button>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
