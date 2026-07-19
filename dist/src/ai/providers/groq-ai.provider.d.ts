import { IAIProvider } from '../interfaces/ai.provider.interface';
export declare class GroqAiProvider implements IAIProvider {
    private readonly apiUrl;
    private readonly defaultModel;
    private get headers();
    private callGroq;
    generateQuestions(category: string): Promise<any>;
    analyzeDecision(answers: Record<string, any>): Promise<{
        insights: string[];
    }>;
    compareScenarios(scenarios: any[]): Promise<{
        recommendation: any;
    }>;
    generateSummary(answers: Record<string, any>): Promise<string>;
    generateRecommendations(answers: Record<string, any>): Promise<{
        action: string;
        reasoning: string;
        priority: string;
    }[]>;
    generateTopicAndCategory(message: string): Promise<{
        title: string;
        category: string;
    }>;
    generateFullReport(title: string, category: string, answers: Record<string, any>, context?: any): Promise<any>;
    streamChat(message: string | any[], context?: any): AsyncGenerator<string>;
    generateQuickReplies(aiResponse: string): Promise<string[]>;
}
