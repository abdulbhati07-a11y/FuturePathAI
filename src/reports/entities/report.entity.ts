import { BaseEntity } from '../../common/entities/base.entity';

export class ReportEntity extends BaseEntity {
  simulationId: string;
  userId: string;
  summary: string;
  chartData: Array<{
    chartType: string;
    title: string;
    labels: string[];
    series: Array<{ name: string; data: number[] }>;
  }>;
  timeline: Array<{
    year: number;
    milestone: string;
    impact: string;
  }>;
  scores: {
    decision: number;
    risk: number;
    confidence: number;
  };
  recommendations: Array<{
    action: string;
    reasoning: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
}
