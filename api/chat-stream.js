export const config = {
  runtime: 'edge', // Edge runtime is required for streaming responses on Vercel
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const { messages, userProfile } = await req.json();
  const apiKey = process.env.OPENCODEZEN_API_KEY;

  if (!apiKey) {
    return new Response('Missing OpenCodeZen API Key', { status: 500 });
  }

  const SIMULATION_SYSTEM_PROMPT = `You are FuturePath AI — an expert decision intelligence system.
Your role is to guide users through structured life-decision simulations.

BEHAVIOR:
- Ask ONE focused question at a time to gather the information needed to model the user's decision.
- Each question should dig deeper into a specific dimension: financial impact, risk tolerance, timelines, personal values, alternatives considered, or emotional readiness.
- EVERY question you ask MUST end with 3–4 concrete answer options the user can pick from, formatted as a short lettered list (A), B), C), D)). Make the options specific and mutually exclusive, covering the realistic range.
- Keep your responses concise (2–4 sentences plus the options list).
- After 4–5 exchanges you should have enough data to synthesize a recommendation.

WHEN GIVING ADVICE OR A RECOMMENDATION, BE PRECISE:
- Commit to ONE clear verdict first ("Do X"), then justify it.
- Quantify everything you can.
- When you have gathered enough context, proactively summarize with: "Based on what you've shared, I'm ready to generate your full simulation report. Type 'generate report' or click View Results when ready."

TONE: Direct, data-driven, empathetic. No filler words.`;

  let payload = [];
  const systemMsg = {
    role: 'system',
    content: SIMULATION_SYSTEM_PROMPT + (userProfile ? `\n\nUSER PROFILE:\n${JSON.stringify(userProfile)}` : '')
  };

  if (Array.isArray(messages) && messages.length > 0) {
    const hasSystem = messages[0]?.role === 'system';
    payload = hasSystem ? messages : [systemMsg, ...messages];
  } else {
    payload = [systemMsg, { role: 'user', content: 'Start the simulation.' }];
  }

  try {
    const apiRes = await fetch('https://opencode.ai/zen/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-v4-flash-free',
        messages: payload,
        stream: true,
        reasoning_effort: 'none',
        temperature: 0.4,
      })
    });

    if (!apiRes.ok) {
      return new Response(`OpenCodeZen API error: ${apiRes.statusText}`, { status: apiRes.status });
    }

    // Create a TransformStream to convert OpenCodeZen chunks into our SSE format
    const stream = new TransformStream({
      async transform(chunk, controller) {
        const decoder = new TextDecoder();
        const text = decoder.decode(chunk);
        const lines = text.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6));
              const token = data.choices[0]?.delta?.content;
              if (token) {
                // Send standard SSE format { type: 'token', value: '...' }
                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'token', value: token })}\n\n`));
              }
            } catch (e) {
              // Ignore parse errors on partial chunks
            }
          }
        }
      },
      flush(controller) {
        // Send final metrics (mocked as deterministic based on user turns)
        const userTurns = payload.filter(m => m.role === 'user').length;
        const confidence = Math.min(55 + (userTurns * 8), 95);
        const riskLevel = Math.max(72 - (userTurns * 5), 40);
        const metricsStr = JSON.stringify({ riskLevel, confidence, answeredTurns: userTurns });
        
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'metrics', value: metricsStr })}\n\n`));
      }
    });

    return new Response(apiRes.body.pipeThrough(stream), {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });

  } catch (err) {
    return new Response('Stream error', { status: 500 });
  }
}
