export declare class ProbabilityService {
    calculateProbabilities(answers: Record<string, any>): {
        bestCase: string;
        worstCase: string;
        mostLikely: string;
        confidencePercent: number;
        riskPercent: number;
    };
}
