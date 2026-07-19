export declare class DecisionEngineService {
    calculateScores(answers: Record<string, any>): {
        decisionScore: number;
        riskScore: number;
        confidenceScore: number;
    };
    generateFinancialProjections(answers: Record<string, any>): {
        labels: string[];
        series: {
            name: string;
            data: number[];
        }[];
    };
    generateTimeline(answers: Record<string, any>): {
        year: number;
        milestone: string;
        impact: string;
    }[];
}
