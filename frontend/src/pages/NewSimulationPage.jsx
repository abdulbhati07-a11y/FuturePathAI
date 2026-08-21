import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '../api/client';
import ChatMessage from '../components/chat/ChatMessage';
import ChatComposer from '../components/chat/ChatComposer';
import LiveInsightPanel from '../components/chat/LiveInsightPanel';
import { extractOptions } from '../components/chat/messageFormat';
import { ThinkingIndicator, SavePauseBar } from '../components/chat/ChatFooter';
import { createSimulation, streamChatReply, saveDraftAndPause } from '../api/chat';
import { ChevronDown } from 'lucide-react';
import { useStickyScroll } from '../hooks/useStickyScroll';
import './NewSimulationPage.css';

// The chat is open-ended — the user can exchange as many messages as they like.
// This is only the point at which we surface that a full report can now be
// generated; it never caps or ends the conversation.
const REPORT_THRESHOLD = 5;

// Common decisions offered as one-tap chips in the opening message. Keep the
// list to five so that — together with the "something else" option — the total
// stays within the A–F range the option-chip parser supports.
const SIMULATION_STARTERS = [
  'Should I change careers or switch jobs?',
  'Should I start a business or side hustle?',
  'Should I make a big financial move (invest, buy a home)?',
  'Should I go back to school or get a degree?',
  'Should I relocate to a new city or country?',
];
const SOMETHING_ELSE = "Something else — I'll type it below";

// One fixed, professional greeting shown every time the chat opens. It is a
// static message (never AI-generated), so it is identical on every open and
// never invents a decision the user didn't state. The lettered lines are
// rendered as tappable chips and stripped from the body text.
const OPENING_MESSAGE = [
  '👋 **Welcome to FuturePath AI.**',
  'I simulate how a major life or career decision could unfold — the likely outcomes, the risks, and the trade-offs — then turn it into a clear, personalized report.',
  '',
  '**What would you like to simulate?** Pick a common decision below, or type your own.',
  '',
  ...SIMULATION_STARTERS.map((s, i) => `${String.fromCharCode(65 + i)}) ${s}`),
  `${String.fromCharCode(65 + SIMULATION_STARTERS.length)}) ${SOMETHING_ELSE}`,
].join('\n');


function ts() {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

/** Convert UI messages to the API history format (role + content only). */
function toHistory(msgs) {
  return msgs
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({ role: m.role, content: m.content }));
}

/**
 * Build the payload persisted to `simulation.answers` before a report is
 * generated. The backend is stateless — it never sees the chat — so this is the
 * only record of the conversation, and the report is grounded entirely on it.
 * `transcript` keeps the AI's questions and the user's answers in order (so the
 * report generator reads the real exchange); `qa` keeps the flat answers-only
 * map the older rows use, for backward compatibility.
 */
function toTranscript(msgs) {
  const transcript = msgs
    .filter(m => (m.role === 'user' || m.role === 'assistant') && m.content?.trim())
    .map(m => ({ role: m.role, content: m.content.trim() }));
  const qa = {};
  let n = 0;
  for (const t of transcript) if (t.role === 'user') qa[`q${n++}`] = t.content;
  return { transcript, qa };
}

export default function NewSimulationPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Pre-filled message from onboarding prompt chips
  const initialMessage = location.state?.initialMessage ?? null;

  const [simulationId, setSimulationId]     = useState(null);
  const [messages, setMessages]             = useState([]);
  const [, setSuggestions]                  = useState([]);
  const [insight, setInsight]               = useState(null);
  const [metrics, setMetrics]               = useState(null);
  const [isThinking, setIsThinking]         = useState(false);
  const [isStreaming, setIsStreaming]        = useState(false);
  const [currentStep, setCurrentStep]       = useState(0);
  const [isSaving, setIsSaving]             = useState(false);
  const [isGenerating, setIsGenerating]     = useState(false);
  const [initError, setInitError]           = useState('');
  const [resumeCtx, setResumeCtx]           = useState(null);

  const abortRef     = useRef(false);
  const composerRef  = useRef(null);
  const handleSendRef = useRef(null);   // latest handleSend, for the memo-stable option handler

  // Sticky-bottom scrolling for the streaming chat (see hooks/useStickyScroll).
  // Passing `messages` as the dep follows both new messages and the per-token
  // growth of the streaming reply (each token yields a new array reference).
  const { scrollRef, showJumpButton, scrollToBottom, handleScroll, pin } =
    useStickyScroll(messages);

  // In React 18 Strict Mode, components mount -> unmount -> remount.
  // We must reset the ref on mount so the chat isn't permanently aborted.
  useEffect(() => {
    abortRef.current = false;
    return () => { abortRef.current = true; };
  }, []);

  // ── Handle stranded draft on mount ───────────────────────────
  useEffect(() => {
    async function processStrandedDraft() {
      let saved;
      try {
        saved = localStorage.getItem('fp_sim_draft');
        if (!saved) return;
      } catch {
        return;
      }
      let simId, msgs;
      try {
        ({ simId, msgs } = JSON.parse(saved));
      } catch {
        // Unparseable, so no future attempt can do better with it. The old code
        // left it in place "for the next attempt" and re-threw on every mount,
        // keeping a dead key forever.
        localStorage.removeItem('fp_sim_draft');
        return;
      }
      try {
        if (!simId || !msgs?.length) {
          localStorage.removeItem('fp_sim_draft');   // nothing recoverable in it
          return;
        }
        // Persist the whole exchange, not just the user's answers, so a
        // recovered draft grounds its report as well as a live one does.
        await apiClient.patch(`/simulations/${simId}`, {
          answers: toTranscript(msgs),
          status: 'IN_PROGRESS',
        });
        // Drop the draft only once the server has it — on failure it stays put
        // so the next mount can retry instead of losing the conversation.
        localStorage.removeItem('fp_sim_draft');
      } catch {
        // failed PATCH — leave it for the next attempt
      }
    }
    processStrandedDraft();
  }, []);

  // ── Autosave draft to localStorage after each completed step ──────────
  useEffect(() => {
    if (!simulationId || messages.length === 0 || isStreaming) return;
    try {
      localStorage.setItem('fp_sim_draft', JSON.stringify({
        simId: simulationId,
        msgs: messages,
        step: currentStep,
        savedAt: Date.now(),
      }));
    } catch {
      // storage quota exceeded — ignore
    }
  }, [simulationId, messages, currentStep, isStreaming]);

  // ── Open the session ──────────────────────────────────────────────────────
  // Normal open shows a fixed greeting (no AI call). A prompt-chip open starts
  // the AI turn immediately; a saved draft is restored by the effect above.
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        // If a prompt chip was clicked, use its message to generate a
        // topic-specific simulation title and start the chat with it.
        if (initialMessage) {
          // Add the user's message immediately to the UI
          const userMsg = {
            id: `u_init`,
            role: 'user',
            content: initialMessage,
            timestamp: ts(),
          };
          setMessages([userMsg]);
          setCurrentStep(1);
          pin();

          // Detect topic → create sim → stream response
          const { title, category } = await apiClient
            .post('/ai/generate-topic', { message: initialMessage })
            .catch(() => ({ title: 'New Simulation', category: 'PERSONAL' }));

          const sim = await createSimulation({ title, category });
          if (!mounted) return;
          setSimulationId(sim.id);

          await runStreamTurn(sim.id, initialMessage, []);
        } else {
          // Normal open: show one fixed, professional greeting with quick-pick
          // options. We deliberately do NOT create a simulation or call the AI
          // yet — the session is created lazily on the user's first real
          // message (see handleSend). This guarantees the opening is identical
          // every time and never assumes a decision the user hasn't made.
          setMessages([
            { id: 'a_opening', role: 'assistant', content: OPENING_MESSAGE, timestamp: ts() },
          ]);
        }
      } catch (err) {
        if (!mounted) return;
        setInitError(err.message || 'Could not start the simulation.');
        setIsThinking(false);
      }
    }

    init();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Core stream turn ───────────────────────────────────────────────────────
  /**
   * @param {string}  simId        - simulation ID
   * @param {string|null} userText - the latest user message (null = opening greeting)
   * @param {Array}   history      - all prior messages in API format
   */
  async function runStreamTurn(simId, userText, history, attempt = 0) {
    const MAX_RETRIES = 3;
    setSuggestions([]);
    setResumeCtx(null);
    setIsThinking(true);

    const aiId = `a_${Date.now()}`;
    let accumulated = '';
    let streamStarted = false;

    try {
      const { suggestions: nextSuggestions, insight: nextInsight, metrics: nextMetrics } =
        await streamChatReply(
          simId,
          userText,
          history,
          (chunk) => {
            if (abortRef.current) return;
            if (!streamStarted) {
              streamStarted = true;
              setIsThinking(false);
              setIsStreaming(true);
              setMessages(prev => [
                ...prev,
                { id: aiId, role: 'assistant', content: '', timestamp: ts() },
              ]);
            }
            accumulated += chunk;
            setMessages(prev =>
              prev.map(m => m.id === aiId ? { ...m, content: accumulated } : m)
            );
          }
        );

      if (!abortRef.current) {
        // Prefer the options the AI embedded in its own question (parsed
        // client-side, no extra round-trip). Fall back to the server's
        // generated suggestions only when the message has no lettered options.
        const embedded = extractOptions(accumulated).map(o => o.text);
        setSuggestions(embedded.length >= 2 ? embedded : (nextSuggestions || []));
        if (nextInsight) setInsight(nextInsight);
        if (nextMetrics) setMetrics(nextMetrics);
      }
    } catch (err) {
      if (abortRef.current) return;

      // Retry on network errors (not on AI-level errors like "Stream failed")
      const isNetworkError = err.message?.includes('Network error') ||
        err.message?.includes('fetch') ||
        err.message?.includes('stream');

      if (isNetworkError && attempt < MAX_RETRIES) {
        const delay = Math.min(1000 * 2 ** attempt, 8000); // 1s, 2s, 4s, 8s cap
        // Drop any partial bubble from this failed attempt so the retry
        // doesn't leave a truncated half-message stacked above the new one.
        if (streamStarted) {
          setMessages(prev => prev.filter(m => m.id !== aiId));
        }
        setMessages(prev => [
          ...prev,
          {
            id: `retry_${Date.now()}`,
            role: 'assistant',
            content: `⚡ Connection interrupted — retrying in ${delay / 1000}s… (attempt ${attempt + 1}/${MAX_RETRIES})`,
            timestamp: ts(),
          },
        ]);
        setIsThinking(false);
        setIsStreaming(false);
        await new Promise(r => setTimeout(r, delay));
        if (!abortRef.current) {
          // Remove the retry notice and try again
          setMessages(prev => prev.filter(m => !m.id.startsWith('retry_')));
          await runStreamTurn(simId, userText, history, attempt + 1);
        }
        return;
      }

      // Retries exhausted (or a non-network error). If we already have partial
      // text, keep it and offer a one-tap resume instead of discarding it.
      if (streamStarted && accumulated.trim()) {
        setMessages(prev =>
          prev.map(m =>
            m.id === aiId ? { ...m, content: accumulated, interrupted: true } : m,
          ),
        );
        setResumeCtx({ simId, userText, history });
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: `err_${Date.now()}`,
            role: 'assistant',
            content: `⚠️ ${err.message || 'Something went wrong. Please try again.'}`,
            timestamp: ts(),
          },
        ]);
        setResumeCtx({ simId, userText, history });
      }
    } finally {
      if (!abortRef.current) {
        setIsThinking(false);
        setIsStreaming(false);
      }
    }
  }

  // ── User sends a message ───────────────────────────────────────────────────
  async function handleSend(text) {
    if (!text?.trim() || isThinking || isStreaming) return;

    pin();

    // Add user message to UI immediately
    const userMsg = { id: `u_${Date.now()}`, role: 'user', content: text.trim(), timestamp: ts() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    // Records step count for the autosaved draft only. It no longer gates the
    // UI — the chat is never capped — so it increments freely.
    setCurrentStep(s => s + 1);

    const history = toHistory(messages); // history BEFORE this user message

    // On the very first user message, auto-detect topic/category and update the sim
    if (!simulationId) {
      setIsThinking(true);
      try {
        const { title, category } = await apiClient
          .post('/ai/generate-topic', { message: text.trim() })
          .catch(() => ({ title: 'New Simulation', category: 'PERSONAL' }));
        const sim = await createSimulation({ title, category });
        if (!abortRef.current) {
          setSimulationId(sim.id);
          await runStreamTurn(sim.id, text.trim(), history);
        }
      } catch (err) {
        if (!abortRef.current) {
          setInitError(err.message || 'Failed to initialize simulation.');
          setIsThinking(false);
        }
      }
    } else {
      await runStreamTurn(simulationId, text.trim(), history);
    }
  }

  // Keep a ref to the latest handleSend so the memo-stable handleOptionClick
  // below always calls the current closure. handleSend is recreated every
  // render (it closes over `messages`), so we can't depend on it directly
  // without recreating handleOptionClick — which would defeat React.memo on
  // <ChatMessage> and re-render every bubble on every streamed token.
  useEffect(() => { handleSendRef.current = handleSend; });

  // ── Option chip clicked ────────────────────────────────────────────────────
  // Most chips send their text as the user's answer. The "something else"
  // chip is different: it just focuses the composer so the user can type a
  // decision that isn't in the common list.
  // Empty deps → stable identity across renders (composerRef / handleSendRef are
  // refs, SOMETHING_ELSE is a module constant), so memoized bubbles stay put.
  const handleOptionClick = useCallback((text) => {
    if (text === SOMETHING_ELSE) {
      composerRef.current?.focus();
      return;
    }
    handleSendRef.current?.(text);
  }, []);

  // ── Resume an interrupted turn ─────────────────────────────────────────────
  function handleResume() {
    if (!resumeCtx) return;
    const { simId, userText, history } = resumeCtx;
    // Drop any interrupted/error bubble before re-running the turn.
    setMessages(prev => prev.filter(m => !m.interrupted && !m.id.startsWith('err_')));
    setResumeCtx(null);
    runStreamTurn(simId, userText, history);
  }

  // ── Save draft ─────────────────────────────────────────────────────────────
  async function handleSaveDraft() {
    if (!simulationId) { navigate('/app/dashboard'); return; }
    setIsSaving(true);
    try {
      await saveDraftAndPause(simulationId);
      localStorage.removeItem('fp_sim_draft');
      navigate('/app/dashboard');
    } catch {
      setIsSaving(false);
    }
  }

  // ── Finish & generate full report ──────────────────────────────────────────
  async function handleGenerateReport() {
    if (!simulationId) return;
    setIsGenerating(true);
    try {
      // 1. Persist the full Q&A transcript FIRST. The backend never saw the
      //    chat, so without this the report would be generated from nothing but
      //    the title and category. Everything downstream depends on it, so a
      //    failure here aborts rather than producing an ungrounded report.
      await apiClient.patch(`/simulations/${simulationId}`, {
        answers: toTranscript(messages),
      });

      // 2. Generate the AI report from the persisted transcript. This is also
      //    what scores the simulation and marks it COMPLETED — the old separate
      //    /analyze call is deliberately gone, because scores now come from the
      //    report's projection, so calling it first only risked marking the
      //    simulation complete moments before report generation failed.
      await apiClient.post(`/reports/generate/${simulationId}`);

      // 3. Only now is the conversation safely stored server-side, so the local
      //    draft is no longer the only copy and can be dropped.
      localStorage.removeItem('fp_sim_draft');
      navigate(`/simulations/${simulationId}/results`);
    } catch (err) {
      // Stay on the page with the draft intact so the user can simply retry —
      // navigating to an empty or half-built report would be worse.
      setIsGenerating(false);
      setMessages(prev => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: `⚠️ Could not generate your report: ${err.message}. Your conversation is saved — tap "Generate report" to try again.`,
          timestamp: ts(),
        },
      ]);
    }
  }

  // ── View results (quick navigate) ─────────────────────────────────────────
  // Function removed because users must generate the report before viewing it

  const busy       = isThinking || isStreaming || isGenerating;

  // Detect the AI's own "ready to generate report" sentinel in the last
  // assistant message, so we can surface a prominent CTA instead of relying
  // on the user typing "generate report".
  const lastAiMessage = [...messages].reverse().find(m => m.role === 'assistant');
  const reportReady =
    !isStreaming && !isThinking &&
    /ready to generate your full simulation report/i.test(lastAiMessage?.content || '');

  // Answered-question progress toward the report threshold. The chat is never
  // capped: once the user has answered enough (or the AI signals it has enough
  // context), we simply surface that a full report can be generated — the user
  // stays free to keep chatting to refine it.
  const answeredCount   = messages.filter(m => m.role === 'user').length;
  const reportAvailable = answeredCount >= REPORT_THRESHOLD || reportReady;

  return (
    <div className="new-sim-page">

      <div className="new-sim-page__body">
        {/* ── Chat column ─────────────────────────────────────────────────── */}
        <div className="new-sim-page__chat-col">
          {/* ── Step progress ─────────────────────────────────────────────── */}
          <div className="new-sim-page__progress">
            {Array.from({ length: REPORT_THRESHOLD }, (_, i) => (
              <div
                key={i}
                className={
                  'new-sim-page__progress-step' +
                  (i < answeredCount ? ' new-sim-page__progress-step--done' : '') +
                  (i === answeredCount && !reportAvailable ? ' new-sim-page__progress-step--active' : '')
                }
              />
            ))}
            <span className="new-sim-page__progress-label">
              {reportAvailable
                ? '✅ Report ready'
                : `Question ${Math.min(answeredCount + 1, REPORT_THRESHOLD)} of ~${REPORT_THRESHOLD}`}
            </span>
          </div>

          <div className="new-sim-page__messages-wrap">
            <div
              className="new-sim-page__messages"
              ref={scrollRef}
              onScroll={handleScroll}
            >
              {initError && (
                <div className="new-sim-page__error">
                  ⚠️ {initError}
                  <button type="button" onClick={() => window.location.reload()} style={{ marginLeft: 12, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
                    Retry
                  </button>
                </div>
              )}

              {messages.map((m, idx) => (
                <ChatMessage
                  key={m.id}
                  role={m.role}
                  content={m.content}
                  timestamp={m.timestamp}
                  isStreaming={
                    isStreaming &&
                    m.role === 'assistant' &&
                    idx === messages.length - 1
                  }
                  showOptions={
                    m.role === 'assistant' && idx === messages.length - 1 && !busy
                  }
                  onOptionClick={handleOptionClick}
                />
              ))}
            </div>

            {showJumpButton && (
              <button
                type="button"
                className="new-sim-page__jump-btn"
                onClick={() => scrollToBottom()}
                aria-label="Scroll to latest message"
              >
                <ChevronDown size={16} strokeWidth={2.5} aria-hidden="true" />
                Scroll to bottom
              </button>
            )}
          </div>

          {/* ── Footer ──────────────────────────────────────────────────── */}
          <div className="new-sim-page__footer">
            {isThinking && <ThinkingIndicator />}

            {resumeCtx && !busy && (
              <div className="new-sim-page__resume">
                <span className="new-sim-page__resume-text">
                  The reply was interrupted.
                </span>
                <button
                  type="button"
                  className="new-sim-page__resume-btn"
                  onClick={handleResume}
                >
                  ↻ Resume
                </button>
              </div>
            )}

            {reportAvailable && !busy && (
              <div className="new-sim-page__report-cta">
                <span className="new-sim-page__report-cta-text">
                  ⚡ Enough context gathered — generate your full report now, or keep chatting to refine it.
                </span>
                <button
                  type="button"
                  className="new-sim-page__report-cta-btn"
                  onClick={handleGenerateReport}
                  disabled={busy || !simulationId}
                >
                  Generate Full Report →
                </button>
              </div>
            )}

            {/* The composer is ALWAYS available — the chat is never force-ended.
                Once enough has been shared, report generation is surfaced (in the
                side panel and the CTA above), but the user can keep chatting with
                no step limit. */}
            <ChatComposer
              ref={composerRef}
              onSend={handleSend}
              disabled={busy}
            />

            <div className="new-sim-page__action-row">
              <SavePauseBar onSave={handleSaveDraft} saving={isSaving} />

              <button
                type="button"
                className="new-sim-page__generate-btn"
                onClick={handleGenerateReport}
                disabled={busy || !simulationId}
                title="Run the AI analysis and generate your full report"
              >
                {isGenerating ? (
                  <><span className="new-sim-page__spinner" /> Generating Report…</>
                ) : (
                  '⚡ Generate Full Report'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Side panel: report availability + live insight ───────────── */}
        <div className="new-sim-page__insight-slot">
          {reportAvailable && (
            <div className="new-sim-page__report-avail" aria-live="polite">
              <div className="new-sim-page__report-avail-head">
                <span className="new-sim-page__report-avail-dot" />
                <span>Report generation available</span>
              </div>
              <p className="new-sim-page__report-avail-text">
                You've shared enough to generate your full report. Generate it now,
                or keep chatting to refine it — there's no step limit.
              </p>
              <button
                type="button"
                className="new-sim-page__report-avail-btn"
                onClick={handleGenerateReport}
                disabled={busy || !simulationId}
              >
                {isGenerating ? (
                  <><span className="new-sim-page__spinner" /> Generating…</>
                ) : (
                  'Generate Full Report →'
                )}
              </button>
            </div>
          )}
          <LiveInsightPanel insight={insight} metrics={metrics} />
        </div>
      </div>
    </div>
  );
}
