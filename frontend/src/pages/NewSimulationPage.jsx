import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '../api/client';
import ChatMessage from '../components/chat/ChatMessage';
import ChatComposer from '../components/chat/ChatComposer';
import LiveInsightPanel from '../components/chat/LiveInsightPanel';
import { extractOptions } from '../components/chat/messageFormat';
import { ThinkingIndicator, SavePauseBar } from '../components/chat/ChatFooter';
import { createSimulation, streamChatReply, saveDraftAndPause } from '../api/chat';
import './NewSimulationPage.css';

const TOTAL_STEPS = 6;

function ts() {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

/** Convert UI messages to the API history format (role + content only). */
function toHistory(msgs) {
  return msgs
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({ role: m.role, content: m.content }));
}

export default function NewSimulationPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Pre-filled message from onboarding prompt chips
  const initialMessage = location.state?.initialMessage ?? null;

  const [simulationId, setSimulationId]     = useState(null);
  const [messages, setMessages]             = useState([]);
  const [suggestions, setSuggestions]       = useState([]);
  const [insight, setInsight]               = useState(null);
  const [metrics, setMetrics]               = useState(null);
  const [isThinking, setIsThinking]         = useState(false);
  const [isStreaming, setIsStreaming]        = useState(false);
  const [currentStep, setCurrentStep]       = useState(0);
  const [isSaving, setIsSaving]             = useState(false);
  const [isGenerating, setIsGenerating]     = useState(false);
  const [initError, setInitError]           = useState('');
  const [resumeCtx, setResumeCtx]           = useState(null);

  const scrollRef    = useRef(null);
  const atBottomRef  = useRef(true);
  const abortRef     = useRef(false);

  // In React 18 Strict Mode, components mount -> unmount -> remount.
  // We must reset the ref on mount so the chat isn't permanently aborted.
  useEffect(() => {
    abortRef.current = false;
    return () => { abortRef.current = true; };
  }, []);

  // ── Restore draft from localStorage on mount ───────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem('fp_sim_draft');
      if (!saved) return;
      const { simId, msgs, step } = JSON.parse(saved);
      if (simId && msgs?.length > 0) {
        setSimulationId(simId);
        setMessages(msgs);
        setCurrentStep(step ?? msgs.filter(m => m.role === 'user').length);
      }
    } catch {
      // corrupted draft — ignore
    }
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

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  function handleScroll() {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    atBottomRef.current = scrollHeight - scrollTop - clientHeight < 100;
  }

  useEffect(() => {
    if (atBottomRef.current && scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  // ── Open the session: create sim + get first AI greeting ──────────────────
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
          atBottomRef.current = true;

          // Detect topic → create sim → stream response
          const { title, category } = await apiClient.post('/ai/generate-topic', {
            message: initialMessage,
          }).catch(() => ({ title: 'New Simulation', category: 'PERSONAL' }));

          const sim = await createSimulation({ title, category });
          if (!mounted) return;
          setSimulationId(sim.id);

          await runStreamTurn(sim.id, initialMessage, []);
        } else {
          // Normal open: create placeholder sim + stream opening greeting
          const sim = await createSimulation({ title: 'New Simulation', category: 'PERSONAL' });
          if (!mounted) return;
          setSimulationId(sim.id);
          await runStreamTurn(sim.id, null, []);
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

    atBottomRef.current = true;

    // Add user message to UI immediately
    const userMsg = { id: `u_${Date.now()}`, role: 'user', content: text.trim(), timestamp: ts() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setCurrentStep(s => Math.min(s + 1, TOTAL_STEPS));

    const history = toHistory(messages); // history BEFORE this user message

    // On the very first user message, auto-detect topic/category and update the sim
    if (!simulationId) {
      setIsThinking(true);
      try {
        const { title, category } = await apiClient.post('/ai/generate-topic', { message: text.trim() });
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
      // 0. Persist the real conversation so BOTH the decision-engine scores and
      //    the AI report are grounded in what the user actually said (not an
      //    empty {}). Drop error/interrupted bubbles — only genuine turns.
      const conversation = messages
        .filter(
          (m) =>
            (m.role === 'user' || m.role === 'assistant') &&
            m.content &&
            !m.interrupted &&
            !m.id?.startsWith('err_') &&
            !m.id?.startsWith('retry_'),
        )
        .map((m) => ({ role: m.role, content: m.content }));
      await apiClient.patch(`/simulations/${simulationId}`, {
        answers: { conversation },
      });
      // 1. Run the decision engine to compute scores
      await apiClient.post(`/simulations/${simulationId}/analyze`);
      // 2. Generate the AI report
      await apiClient.post(`/reports/generate/${simulationId}`);
      // 3. Navigate to results
      localStorage.removeItem('fp_sim_draft');
      navigate(`/simulations/${simulationId}/results`);
    } catch (err) {
      setIsGenerating(false);
      setMessages(prev => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: `⚠️ Could not generate report: ${err.message}. You can still view partial results.`,
          timestamp: ts(),
        },
      ]);
    }
  }

  // ── View results (quick navigate) ─────────────────────────────────────────
  // Function removed because users must generate the report before viewing it

  const isComplete = currentStep >= TOTAL_STEPS && !isThinking && !isStreaming;
  const busy       = isThinking || isStreaming || isGenerating;

  // Detect the AI's own "ready to generate report" sentinel in the last
  // assistant message, so we can surface a prominent CTA instead of relying
  // on the user typing "generate report".
  const lastAiMessage = [...messages].reverse().find(m => m.role === 'assistant');
  const reportReady =
    !isStreaming && !isThinking &&
    /ready to generate your full simulation report/i.test(lastAiMessage?.content || '');

  // Answered-question progress toward the ~5-exchange target the prompt aims for.
  const answeredCount = messages.filter(m => m.role === 'user').length;
  const targetQuestions = 5;

  return (
    <div className="new-sim-page">

      <div className="new-sim-page__body">
        {/* ── Chat column ─────────────────────────────────────────────────── */}
        <div className="new-sim-page__chat-col">
          {/* ── Step progress ─────────────────────────────────────────────── */}
          <div className="new-sim-page__progress">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div
                key={i}
                className={
                  'new-sim-page__progress-step' +
                  (i < currentStep ? ' new-sim-page__progress-step--done' : '') +
                  (i === currentStep && !isComplete ? ' new-sim-page__progress-step--active' : '') +
                  (isComplete ? ' new-sim-page__progress-step--done' : '')
                }
              />
            ))}
            <span className="new-sim-page__progress-label">
              {isComplete || reportReady
                ? '✅ Ready for results'
                : `Question ${Math.min(answeredCount + 1, targetQuestions)} of ~${targetQuestions}`}
            </span>
          </div>

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
                onOptionClick={handleSend}
              />
            ))}
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

            {reportReady && !isComplete && !isGenerating && (
              <div className="new-sim-page__report-cta">
                <span className="new-sim-page__report-cta-text">
                  ⚡ Enough context gathered — your full report is ready to generate.
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

            {isComplete ? (
              /* Simulation steps complete — prompt user to view results */
              <div className="new-sim-page__complete-bar">
                <p className="new-sim-page__complete-msg">
                  ✅ Simulation complete — your results are ready.
                </p>
                <button
                  type="button"
                  className="new-sim-page__results-btn"
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <><span className="new-sim-page__spinner" /> Generating Report…</>
                  ) : (
                    'View Full Results →'
                  )}
                </button>
              </div>
            ) : (
              <>
                <ChatComposer
                  suggestions={suggestions}
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
              </>
            )}
          </div>
        </div>

        {/* ── Live insight panel ───────────────────────────────────────── */}
        <div className="new-sim-page__insight-slot">
          <LiveInsightPanel insight={insight} metrics={metrics} />
        </div>
      </div>
    </div>
  );
}
