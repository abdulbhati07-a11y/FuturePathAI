import { IAIProvider } from '../interfaces/ai.provider.interface';
export declare class OpenCodeZenAiProvider implements IAIProvider {
    private readonly apiUrl;
    private readonly defaultModel;
    private get headers();
    private callOpenCodeZen;
    generateQuestions(category: string): Promise<any>;
    analyzeDecision(answers: Record<string, any>): Promise<{
        insights: any;
    }>;
    compareScenarios(scenarios: any[]): Promise<{
        recommendation: any;
        reasoning?: undefined;
        runnerUp?: undefined;
    } | {
        recommendation: any;
        reasoning: any;
        runnerUp: any;
    }>;
    generateSummary(answers: Record<string, any>): Promise<string>;
    generateRecommendations(answers: Record<string, any>): Promise<{
        action: any;
        reasoning: any;
        priority: any;
    }[]>;
    generateTopicAndCategory(message: string): Promise<{
        title: string;
        category: string;
    }>;
    generateFullReport(title: string, category: string, answers: Record<string, any>, context?: any): Promise<any>;
    streamChat(message: string | any[], context?: any): AsyncGenerator<string>;
    generateQuickReplies(aiResponse: string): Promise<string[]>;
}
