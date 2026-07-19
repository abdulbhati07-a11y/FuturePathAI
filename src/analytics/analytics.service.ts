import { Injectable } from '@nestjs/common';

@Injectable()
export class AnalyticsService {
  getDashboardStats() {
    return {
      stabilityIndex: { value: 84.2, unit: '%', trend: 'up' },
      riskVector: { value: 12.5, unit: 'pts', label: 'Low', trend: 'down' },
      projectedCapital: { value: 1.4, unit: 'M', prefix: '$' },
      pathAlpha: { value: 26, label: 'A/B', trend: 'up' },
    };
  }

  getMarketCorrelation() {
    return [
      {
        id: 'm1',
        label: 'S&P 500 Index',
        changePercent: 1.24,
        direction: 'up',
      },
      {
        id: 'm2',
        label: 'Interest Rate (Sim)',
        changePercent: -5.25,
        direction: 'down',
      },
    ];
  }

  getSystemMeta() {
    return {
      simulationUptime: 99.98,
      lastRecalc: '82:45m ago',
    };
  }
}
