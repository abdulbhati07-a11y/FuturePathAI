/**
 * chat.js — FuturePath AI streaming chat API
 *
 * Endpoint: POST /ai/simulations/:id/chat
 *   Content-Type: application/json
 *   Accept: text/event-stream
 *
 * Request body:
 *   {
 *     message:  string,                          // latest user message (plain text)
 *     messages: Array<{role, content}>            // FULL conversation history
 *   }
 *
 * SSE event types emitted by the server:
 *   { type: 'token',       value: '<text chunk>' }
 *   { type: 'suggestions', value: ['opt1', 'opt2', …] }
 *   { type: 'insight',     value: { label, message } }
 *   { type: 'metrics',     value: '{"riskLevel":…}' }
 *   { type: 'done',        value: '' }
 *   { type: 'error',       value: '<message>' }
 */

import { apiClient } from './client';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

// ─── Mock data ───────────────────────────────────────────────────────────────

const MOCK_REPLIES = [
  "Welcome to your decision simulation. I'm here to help you model the outcomes of your biggest choices with data-driven precision.\n\nTo start, tell me: **what is the core decision you're facing right now?** (e.g. changing careers, making an investment, relocating, starting a business)",
  "That's a significant decision. Let me ask you a few targeted questions to build an accurate model.\n\n**On a scale of 1–10, how urgent is this decision?** (1 = I can take months, 10 = I need to decide this week)",
  "Understood. Now let's look at the financial dimension.\n\n**What is your current monthly income, and how much runway (savings) do you have if this decision doesn't work out immediately?**",
  "Good context. One more angle: **What does success look like to you in 3 years if this decision goes well?** Be as specific as possible — title, salary, lifestyle, location.",
  "Based on what you've shared, I'm ready to generate your full simulation report. I've modelled 3 scenarios with probability weights.\n\nClick **View Full Results →** to see your personalised analysis.",
];

let mockReplyIndex = 0;

const MOCK_SUGGESTIONS = [
  ['Tell me more about the risks', 'Best case scenario?', 'Compare alternatives', 'What should I do next?'],
  ['Financial impact?', 'Timeline?', 'What if I wait?', 'Show worst case'],
];

const MOCK_INSIGHT = {
  label: 'LIVE PATH INSIGHT',
  message: "Your emphasis on 'stability' is increasing the probability of a conservative path by 18%.",
};

async function* mockStream(text) {
  // Stream word-by-word with realistic pacing
  const words = text.split(' ');
  for (const word of words) {
    await new Promise(r => setTimeout(r, 28 + Math.random() * 20));
    yield word + ' ';
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Stream a chat reply token-by-token.
 *
 * @param {string} simulationId
 * @param {string|null} userMessage  - The latest user message, or null for the opening greeting
 * @param {Array<{role,content}>} history - Full conversation history (all prior turns)
 * @param {(chunk: string) => void} onChunk - Called for each streamed token
 * @returns {Promise<{ suggestions: string[], insight: object|null }>}
 */
export async function streamChatReply(simulationId, userMessage, history, onChunk) {
  // ── Mock mode ─────────────────────────────────────────────────────────────
  if (USE_MOCKS) {
    const reply = MOCK_REPLIES[mockReplyIndex % MOCK_REPLIES.length];
    mockReplyIndex++;

    for await (const chunk of mockStream(reply)) {
      onChunk(chunk);
    }

    const suggestions = MOCK_SUGGESTIONS[mockReplyIndex % MOCK_SUGGESTIONS.length];
    return {
      suggestions,
      insight: mockReplyIndex === 1 ? MOCK_INSIGHT : null,
      metrics: { riskLevel: 60, confidence: 70, answeredTurns: mockReplyIndex },
    };
  }

  // ── Real streaming ────────────────────────────────────────────────────────
  const token = localStorage.getItem('accessToken');

  // Build the messages array to send.
  // We always send the full history plus the new user message so the AI
  // has complete context for every response.
  const messages = [
    ...(history || []),
    ...(userMessage ? [{ role: 'user', content: userMessage }] : []),
  ];

  let res;
  try {
    res = await fetch(`${BASE_URL}/ai/simulations/${simulationId}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        message: userMessage ?? '',
        messages,
      }),
    });
  } catch (err) {
    throw new Error(`Network error connecting to AI: ${err.message}`);
  }

  if (!res.ok) {
    let errMsg = `AI request failed (${res.status})`;
    try {
      const body = await res.json();
      errMsg = body?.message || errMsg;
    } catch { /* ignore */ }
    throw new Error(errMsg);
  }

  if (!res.body) {
    throw new Error('No response body received from AI endpoint.');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let suggestions = [];
  let insight = null;
  let metrics = null;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE lines are separated by \n\n, individual fields by \n
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';  // last partial line stays in buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;

        const payload = trimmed.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;

        try {
          const event = JSON.parse(payload);

          switch (event.type) {
            case 'token':
              if (event.value) onChunk(event.value);
              break;

            case 'suggestions':
              if (Array.isArray(event.value)) suggestions = event.value;
              break;

            case 'insight':
              if (event.value) insight = event.value;
              break;

            case 'metrics':
              try {
                metrics = typeof event.value === 'string'
                  ? JSON.parse(event.value)
                  : event.value;
              } catch { /* malformed metrics — ignore */ }
              break;

            case 'error':
              throw new Error(event.value || 'AI stream error');

            case 'done':
              // Stream cleanly finished
              break;

            default:
              // Unknown event type — treat as raw token for backwards compatibility
              if (typeof event.value === 'string' && event.value) {
                onChunk(event.value);
              }
          }
        } catch (parseErr) {
          // If the payload isn't JSON (e.g. a raw text chunk), pass it through
          if (payload && !(parseErr instanceof SyntaxError)) throw parseErr;
          if (payload && parseErr instanceof SyntaxError) {
            onChunk(payload);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return { suggestions, insight, metrics };
}

/**
 * Create a new simulation on the backend.
 * Returns { id, title, category, status }
 */
export async function createSimulation({ title, category }) {
  if (USE_MOCKS) {
    return { id: `sim_${Date.now()}`, title, category, status: 'DRAFT' };
  }
  return apiClient.post('/simulations', { title, category });
}

/**
 * Save the current simulation as a draft and pause the session.
 */
export async function saveDraftAndPause(simulationId) {
  if (USE_MOCKS) return { id: simulationId, status: 'DRAFT' };
  return apiClient.patch(`/simulations/${simulationId}`, { status: 'DRAFT' });
}
