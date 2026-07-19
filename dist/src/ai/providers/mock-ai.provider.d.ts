import { IAIProvider } from '../interfaces/ai.provider.interface';
export declare class MockAIProvider implements IAIProvider {
    generateQuestions(category: string): Promise<({
        id: `${string}-${string}-${string}-${string}-${string}`;
        text: string;
        type: string;
        options?: undefined;
    } | {
        id: `${string}-${string}-${string}-${string}-${string}`;
        text: string;
        type: string;
        options: string[];
    })[]>;
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
    generateFullReport(title: string, category: string, answers: Record<string, any>): Promise<any>;
    streamChat(message: string): AsyncGenerator<string>;
    generateQuickReplies(aiResponse: string): Promise<string[]>;
}
