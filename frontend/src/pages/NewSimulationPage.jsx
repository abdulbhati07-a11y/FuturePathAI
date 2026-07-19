import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '../api/client';
import SimulationHeader from '../components/chat/SimulationHeader';
import ChatMessage from '../components/chat/ChatMessage';
import ChatComposer from '../components/chat/ChatComposer';
import LiveInsightPanel from '../components/chat/LiveInsightPanel';
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
  const [isThinking, setIsThinking]         = useState(false);
  const [isStreaming, setIsStreaming]        = useState(false);
  const [currentStep, setCurrentStep]       = useState(0);
  const [isSaving, setIsSaving]             = useState(false);
  const [isGenerating, setIsGenerating]     = useState(false);
  const [initError, setInitError]           = useState('');

  const scrollRef    = useRef(null);
  const atBottomRef  = useRef(true);
  const abortRef     = useRef(false);

  // In React 18 Strict Mode, components mount -> unmount -> remount.
  // We must reset the ref on mount so the chat isn't permanently aborted.
  useEffect(() => {
    abortRef.current = false;
    return () => { abortRef.current = true; };
  }, []);

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
  async function runStreamTurn(simId, userText, history) {
    setSuggestions([]);
    setIsThinking(true);

    const aiId = `a_${Date.now()}`;
    let accumulated = '';
    let streamStarted = false;

    try {
      const { suggestions: nextSuggestions, insight: nextInsight } =
        await streamChatReply(
          simId,
          userText,       // latest user message (or null)
          history,        // full prior history
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
        setSuggestions(nextSuggestions || []);
        if (nextInsight) setInsight(nextInsight);
      }
    } catch (err) {
      if (!abortRef.current) {
        setMessages(prev => [
          ...prev,
          {
            id: `err_${Date.now()}`,
            role: 'assistant',
            content: `⚠️ ${err.message || 'Something went wrong. Please try again.'}`,
            timestamp: ts(),
          },
        ]);
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

  // ── Save draft ─────────────────────────────────────────────────────────────
  async function handleSaveDraft() {
    if (!simulationId) { navigate('/app/dashboard'); return; }
    setIsSaving(true);
    try {
      await saveDraftAndPause(simulationId);
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
      // 1. Run the decision engine to compute scores
      await apiClient.post(`/simulations/${simulationId}/analyze`);
      // 2. Generate the AI report
      await apiClient.post(`/reports/generate/${simulationId}`);
      // 3. Navigate to results
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

  return (
    <div className="new-sim-page">
      <SimulationHeader
        currentStep={currentStep}
        totalSteps={TOTAL_STEPS}
        onClose={() => navigate('/app/dashboard')}
      />

      <div className="new-sim-page__body">
        {/* ── Chat column ─────────────────────────────────────────────────── */}
        <div className="new-sim-page__chat-col">
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
              />
            ))}
          </div>

          {/* ── Footer ──────────────────────────────────────────────────── */}
          <div className="new-sim-page__footer">
            {isThinking && <ThinkingIndicator />}

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
          <LiveInsightPanel insight={insight} />
        </div>
      </div>
    </div>
  );
}
