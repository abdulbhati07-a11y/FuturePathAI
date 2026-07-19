import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getDashboardStats(): {
        stabilityIndex: {
            value: number;
            unit: string;
            trend: string;
        };
        riskVector: {
            value: number;
            unit: string;
            label: string;
            trend: string;
        };
        projectedCapital: {
            value: number;
            unit: string;
            prefix: string;
        };
        pathAlpha: {
            value: number;
            label: string;
            trend: string;
        };
    };
    getMarketCorrelation(): {
        id: string;
        label: string;
        changePercent: number;
        direction: string;
    }[];
    getSystemMeta(): {
        simulationUptime: number;
        lastRecalc: string;
    };
}
