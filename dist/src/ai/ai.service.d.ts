import type { IAIProvider } from './interfaces/ai.provider.interface';
import { UsersService } from '../users/users.service';
export declare class AiService {
    private readonly aiProvider;
    private readonly usersService;
    constructor(aiProvider: IAIProvider, usersService: UsersService);
    getAdvisorInsight(): {
        message: string;
        type: string;
    };
    generateTopicAndCategory(message: string): Promise<{
        title: string;
        category: string;
    }>;
    generateQuickReplies(aiResponse: string): Promise<string[]>;
    generateChatStream(simulationId: string, message: string | Array<{
        role: string;
        content: string;
    }>, userId?: string): AsyncGenerator<{
        data: {
            type: string;
            value: string;
        };
    }>;
}
