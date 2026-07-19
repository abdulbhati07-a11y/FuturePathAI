import { AiService } from './ai.service';
import type { Response } from 'express';
declare class ChatMessageDto {
    role: 'user' | 'assistant';
    content: string;
}
declare class ChatRequestDto {
    message?: string;
    messages?: ChatMessageDto[];
}
export declare class AiController {
    private readonly aiService;
    constructor(aiService: AiService);
    getAdvisorInsight(): {
        message: string;
        type: string;
    };
    generateTopic(message: string): Promise<{
        title: string;
        category: string;
    }>;
    chatStream(simulationId: string, body: ChatRequestDto, user: any, res: Response): void;
}
export {};
