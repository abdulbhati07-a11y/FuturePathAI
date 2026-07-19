import { Injectable } from '@nestjs/common';

@Injectable()
export class ProbabilityService {
  calculateProbabilities(answers: Record<string, any>) {
    return {
      bestCase: 'Highly favorable outcome based on answers.',
      worstCase: 'Potential challenges require mitigation.',
      mostLikely: 'Steady progress towards goal.',
      confidencePercent: Math.floor(Math.random() * 30) + 70, // 70-100%
      riskPercent: Math.floor(Math.random() * 50) + 10, // 10-60%
    };
  }
}
