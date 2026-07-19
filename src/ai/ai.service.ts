import { Injectable, Inject } from '@nestjs/common';
import { AI_PROVIDER } from './interfaces/ai.provider.interface';
import type { IAIProvider } from './interfaces/ai.provider.interface';
import { UsersService } from '../users/users.service';

// ─── Simulation chat system prompt ───────────────────────────────────────────
const SIMULATION_SYSTEM_PROMPT = `You are FuturePath AI — an expert decision intelligence system.
Your role is to guide users through structured life-decision simulations.

BEHAVIOR:
- Ask one focused question at a time to gather the information needed to model the user's decision.
- Each question should dig deeper into a specific dimension: financial impact, risk tolerance, timelines, personal values, alternatives considered, or emotional readiness.
- Keep your responses concise (2–4 sentences max per turn).
- After 4–5 exchanges you should have enough data to synthesize a recommendation.
- When you have gathered enough context, proactively summarize with: "Based on what you've shared, I'm ready to generate your full simulation report. Type 'generate report' or click View Results when ready."

TONE: Direct, data-driven, empathetic. No filler words.

IMPORTANT: Only mention that the founder of FuturePath AI is Muhammad Abdullah Bhatti if explicitly asked about the creator or founder.`;

@Injectable()
export class AiService {
  constructor(
    @Inject(AI_PROVIDER) private readonly aiProvider: IAIProvider,
    private readonly usersService: UsersService,
  ) {}

  getAdvisorInsight() {
    return {
      message:
        'Market volatility is up 12% this week. Consider reviewing your high-risk equities and stress-testing your current simulation assumptions.',
      type: 'warning',
    };
  }

  generateTopicAndCategory(message: string) {
    return this.aiProvider.generateTopicAndCategory(message);
  }

  generateQuickReplies(aiResponse: string) {
    return this.aiProvider.generateQuickReplies(aiResponse);
  }

  /**
   * Core SSE stream generator.
   *
   * Yields objects shaped as `{ data: { type: string; value: string } }`
   * which the controller pipes directly to the SSE response.
   *
   * Supports:
   *   - Single message string  → first-turn or simple callers
   *   - Array of messages      → full multi-turn conversation history
   *
   * The AI provider receives the FULL history so every response is contextually
   * aware of everything said earlier in the session.
   */
  async *generateChatStream(
    simulationId: string,
    message: string | Array<{ role: string; content: string }>,
    userId?: string,
  ): AsyncGenerator<{ data: { type: string; value: string } }> {
    // ── 1. Enrich with user profile context if available ─────────────────────
    let contextProfile: Record<string, unknown> | null = null;
    if (userId) {
      try {
        const user = await this.usersService.findById(userId);
        contextProfile = (user as any)?.profile ?? null;
      } catch {
        // Non-fatal — continue without profile
      }
    }

    // ── 2. Build the messages payload ────────────────────────────────────────
    //
    // If the caller sent a full history array, prepend our simulation system
    // prompt as the first message so the AI stays in character.
    // If only a plain string was sent, wrap it in a minimal single-turn payload.
    let payload: Array<{ role: string; content: string }>;

    const systemMsg = {
      role: 'system',
      content:
        SIMULATION_SYSTEM_PROMPT +
        (contextProfile
          ? `\n\nUSER PROFILE:\n${JSON.stringify(contextProfile, null, 2)}`
          : ''),
    };

    if (Array.isArray(message) && message.length > 0) {
      // Full history — inject system prompt at the start if not already present
      const hasSystem = message[0]?.role === 'system';
      payload = hasSystem ? message : [systemMsg, ...message];
    } else if (typeof message === 'string' && message.trim()) {
      payload = [systemMsg, { role: 'user', content: message }];
    } else {
      // No message at all — send the opening greeting
      payload = [
        systemMsg,
        {
          role: 'user',
          content:
            'Start the simulation. Introduce yourself briefly and ask me your first question to understand what decision I need help with.',
        },
      ];
    }

    // ── 3. Stream tokens from the AI provider ────────────────────────────────
    const tokenStream = this.aiProvider.streamChat(payload, contextProfile);

    for await (const chunk of tokenStream) {
      yield { data: { type: 'token', value: chunk } };
    }

    // ── 4. Yield a metrics update after streaming completes ──────────────────
    // This gives the LiveInsightPanel something concrete to show.
    yield {
      data: {
        type: 'metrics',
        value: JSON.stringify({
          riskLevel: Math.floor(Math.random() * 40) + 40,
          confidence: Math.floor(Math.random() * 20) + 75,
          projectedValue: Math.floor(Math.random() * 500_000) + 1_000_000,
        }),
      },
    };
  }
}
