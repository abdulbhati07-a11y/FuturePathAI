import { apiClient } from './client';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

// Same-origin serverless API base (see src/api/client.js). Streaming needs a raw
// fetch (apiClient buffers JSON), so we build the URL + auth header ourselves here.
const API_BASE = `${import.meta.env.VITE_API_BASE_URL ?? ''}/api`;

// ─── Mock data ───────────────────────────────────────────────────────────────
const MOCK_REPLIES = [
  "Welcome to your decision simulation. What is the core decision you're facing right now?",
  "That's a significant decision. On a scale of 1–10, how urgent is this decision?",
  "Understood. What is your current monthly income, and how much runway (savings) do you have?",
  "Good context. What does success look like to you in 3 years if this decision goes well?",
  "Based on what you've shared, I'm ready to generate your full simulation report.",
];
let mockReplyIndex = 0;
const MOCK_SUGGESTIONS = [
  ['Tell me more about the risks', 'Best case scenario?', 'Compare alternatives', 'What should I do next?'],
  ['Financial impact?', 'Timeline?', 'What if I wait?', 'Show worst case'],
];
const MOCK_INSIGHT = { label: 'LIVE PATH INSIGHT', message: "Your emphasis on 'stability' is increasing the probability of a conservative path by 18%." };

async function* mockStream(text) {
  const words = text.split(' ');
  for (const word of words) {
    await new Promise(r => setTimeout(r, 28 + Math.random() * 20));
    yield word + ' ';
  }
}

export async function streamChatReply(simulationId, userMessage, history, onChunk) {
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

  // Backend expects { message, messages } and streams Server-Sent Events.
  // messages = the full prior turn history; message = the newest user turn.
  const messages = [
    ...(history || []),
    ...(userMessage ? [{ role: 'user', content: userMessage }] : []),
  ];

  const token = localStorage.getItem('accessToken');

  let res;
  try {
    res = await fetch(`${API_BASE}/ai/simulations/${simulationId}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ message: userMessage, messages }),
    });
  } catch (err) {
    throw new Error(`Network error connecting to AI: ${err.message}`);
  }

  if (!res.ok) {
    let errMsg = `AI request failed (${res.status})`;
    try {
      const body = await res.json();
      errMsg = body?.message || body?.error || errMsg;
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
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

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

export async function createSimulation({ title, category }) {
  if (USE_MOCKS) {
    return { id: `sim_${Date.now()}`, title, category, status: 'DRAFT' };
  }
  return apiClient.post('/simulations', { title, category });
}

export async function saveDraftAndPause(simulationId) {
  if (USE_MOCKS) return { id: simulationId, status: 'DRAFT' };
  return apiClient.patch(`/simulations/${simulationId}`, { status: 'DRAFT' });
}
