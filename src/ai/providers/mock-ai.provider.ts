import { Injectable } from '@nestjs/common';
import { IAIProvider } from '../interfaces/ai.provider.interface';
import { randomUUID } from 'crypto';

@Injectable()
export class MockAIProvider implements IAIProvider {
  async generateQuestions(category: string) {
    return [
      {
        id: randomUUID(),
        text: `What is your primary goal for ${category}?`,
        type: 'text',
      },
      {
        id: randomUUID(),
        text: `What is your risk tolerance?`,
        type: 'select',
        options: ['Low', 'Medium', 'High'],
      },
    ];
  }

  async analyzeDecision(answers: Record<string, any>) {
    return { insights: ['Mock insight 1', 'Mock insight 2'] };
  }

  async compareScenarios(scenarios: any[]) {
    return { recommendation: scenarios[0] };
  }

  async generateSummary(answers: Record<string, any>) {
    return 'This is a mock AI-generated summary based on your answers.';
  }

  async generateRecommendations(answers: Record<string, any>) {
    return [
      { action: 'Save more', reasoning: 'Mock reasoning', priority: 'HIGH' },
      {
        action: 'Invest early',
        reasoning: 'Mock reasoning',
        priority: 'MEDIUM',
      },
    ];
  }

  async generateTopicAndCategory(
    message: string,
  ): Promise<{ title: string; category: string }> {
    return {
      title: 'Mock Simulation Topic',
      category: 'PERSONAL',
    };
  }

  async generateFullReport(
    title: string,
    category: string,
    answers: Record<string, any>,
  ): Promise<any> {
    return {
      bestCase: {
        label: 'BEST CASE',
        probability: 22,
        title: 'Mock Best Case',
        description: 'Mock best case description.',
        salaryDelta: '+$165k',
        satisfaction: '9.2/10',
      },
      mostLikely: {
        label: 'MOST LIKELY',
        probability: 63,
        title: 'Mock Most Likely',
        description: 'Mock most likely description.',
        salaryDelta: '+$118k',
        satisfaction: '7.6/10',
      },
      worstCase: {
        label: 'WORST CASE',
        probability: 15,
        title: 'Mock Worst Case',
        description: 'Mock worst case description.',
        salaryDelta: '-$19k',
        satisfaction: '4.1/10',
      },
      rightReasons: ['Mock reason 1', 'Mock reason 2'],
      wrongReasons: ['Mock reason 3', 'Mock reason 4'],
      timeline: [
        { id: 't1', label: 'TODAY', sublabel: 'Decision' },
        { id: 't2', label: 'WEEK 1', sublabel: 'Action' },
      ],
      alternatives: [
        {
          id: 'alt1',
          title: 'Mock Alternative 1',
          subtitle: 'Mock subtitle',
          score: 61,
        },
      ],
    };
  }

  async *streamChat(message: string): AsyncGenerator<string> {
    yield 'This is a mock chat response.';
  }

  async generateQuickReplies(aiResponse: string): Promise<string[]> {
    return ['Mock reply 1', 'Mock reply 2', 'Mock reply 3'];
  }
}
