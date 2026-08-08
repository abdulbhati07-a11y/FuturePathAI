export declare class DecisionEngineService {
    private static readonly RISK_WORDS;
    private static readonly SAFE_WORDS;
    calculateScores(answers: Record<string, any>): {
        decisionScore: number;
        riskScore: number;
        confidenceScore: number;
    };
    private extractConversation;
    private countHits;
    private clamp;
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
