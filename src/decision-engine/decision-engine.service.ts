import { Injectable } from '@nestjs/common';

@Injectable()
export class DecisionEngineService {
  // Words that signal exposure/downside in the user's own description.
  private static readonly RISK_WORDS = [
    'debt',
    'loan',
    'borrow',
    'quit',
    'risky',
    'risk',
    'uncertain',
    'gamble',
    'volatile',
    'laid off',
    'fired',
    'lose',
    'loss',
    'fear',
    'worried',
    'worry',
    'anxious',
    'unstable',
    'no savings',
    'broke',
    'mortgage',
    'deficit',
    'overdraft',
    'bankrupt',
    'stress',
    'desperate',
    'all in',
  ];

  // Words that signal a cushion / preparedness.
  private static readonly SAFE_WORDS = [
    'savings',
    'saved',
    'buffer',
    'emergency fund',
    'stable',
    'secure',
    'diversified',
    'runway',
    'insurance',
    'steady',
    'guaranteed',
    'profit',
    'surplus',
    'experience',
    'skilled',
    'confident',
    'backup',
    'safety net',
    'low risk',
    'passive income',
    'stable income',
  ];

  /**
   * Deterministically derive headline scores from the persisted conversation.
   *
   * This is a pure function of `answers` — same input always yields the same
   * scores (no Math.random / Date), so a report's numbers stay stable across
   * re-reads. `answers.conversation` is the [{ role, content }] chat log the
   * frontend persists before /analyze; older/other shapes fall back to a
   * stringify of the whole object.
   *
   * Ranges are chosen to line up with the frontend mappings:
   *   decisionGrade  >90 A+  / >80 A / else B
   *   riskLevel      <30 Low / <70 Med / else High
   *   confidence     shown as a percentage
   */
  calculateScores(answers: Record<string, any>) {
    const { text, userTurns } = this.extractConversation(answers);
    const normalized = text.toLowerCase().trim();

    // No meaningful input — stable, low-information neutral (still deterministic).
    if (!normalized) {
      return { decisionScore: 70, riskScore: 40, confidenceScore: 65 };
    }

    // Concreteness: specific numbers, money, and timeframes mean the decision
    // has actually been examined — that raises confidence.
    const numberHits = (normalized.match(/\d+/g) || []).length;
    const moneyHits = (normalized.match(/\$/g) || []).length;
    const timeHits = (
      normalized.match(/\b(year|month|week|day|quarter)s?\b/g) || []
    ).length;
    const concreteness = Math.min(numberHits + moneyHits * 2 + timeHits, 12);

    const riskHits = this.countHits(
      normalized,
      DecisionEngineService.RISK_WORDS,
    );
    const safeHits = this.countHits(
      normalized,
      DecisionEngineService.SAFE_WORDS,
    );

    const confidenceScore = this.clamp(
      Math.round(70 + userTurns * 4 + concreteness * 1.5),
      70,
      98,
    );
    // Widened past 60 so the "High" bucket (>=70) is finally reachable when the
    // user describes a genuinely exposed situation.
    const riskScore = this.clamp(
      Math.round(30 + riskHits * 6 - safeHits * 5),
      8,
      80,
    );
    const decisionScore = this.clamp(
      Math.round(100 - riskScore * 0.5 + (confidenceScore - 70) * 0.3),
      55,
      99,
    );

    return { decisionScore, riskScore, confidenceScore };
  }

  /** Pull the chat text + user-turn count out of the persisted answers. */
  private extractConversation(answers: Record<string, any>): {
    text: string;
    userTurns: number;
  } {
    if (!answers || typeof answers !== 'object') {
      return { text: '', userTurns: 0 };
    }

    const convo = (answers as any).conversation;
    if (Array.isArray(convo) && convo.length > 0) {
      const userTurns = convo.filter((m) => m?.role === 'user').length;
      const text = convo
        .map((m) => (typeof m?.content === 'string' ? m.content : ''))
        .join(' ');
      return { text, userTurns };
    }

    // Fallback for legacy key/value answer maps — count nothing as turns but
    // still let keyword/concreteness signals apply.
    try {
      return { text: JSON.stringify(answers), userTurns: 0 };
    } catch {
      return { text: '', userTurns: 0 };
    }
  }

  /** Total occurrences of any dictionary word in the text. */
  private countHits(text: string, words: string[]): number {
    let hits = 0;
    for (const word of words) {
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const matches = text.match(new RegExp(escaped, 'g'));
      if (matches) hits += matches.length;
    }
    return hits;
  }

  private clamp(n: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, n));
  }

  generateFinancialProjections(answers: Record<string, any>) {
    return {
      labels: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'],
      series: [{ name: 'Projected Value', data: [100, 150, 200, 280, 400] }],
    };
  }

  generateTimeline(answers: Record<string, any>) {
    return [
      { year: new Date().getFullYear(), milestone: 'Start', impact: 'Neutral' },
      {
        year: new Date().getFullYear() + 2,
        milestone: 'Growth Phase',
        impact: 'Positive',
      },
    ];
  }
}
