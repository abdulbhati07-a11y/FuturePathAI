export const AI_PROVIDER = Symbol('AI_PROVIDER');

export interface IAIProvider {
  generateQuestions(
    category: string,
  ): Promise<
    Array<{ id: string; text: string; type: string; options?: string[] }>
  >;
  analyzeDecision(answers: Record<string, any>): Promise<any>;
  compareScenarios(scenarios: any[]): Promise<any>;
  generateSummary(answers: Record<string, any>): Promise<string>;
  generateRecommendations(answers: Record<string, any>): Promise<any[]>;
  generateTopicAndCategory(
    message: string,
  ): Promise<{ title: string; category: string }>;
  generateFullReport(
    title: string,
    category: string,
    answers: Record<string, any>,
    context?: any,
  ): Promise<any>;
  streamChat(message: string | any[], context?: any): AsyncGenerator<string>;
  generateQuickReplies(aiResponse: string): Promise<string[]>;
}
