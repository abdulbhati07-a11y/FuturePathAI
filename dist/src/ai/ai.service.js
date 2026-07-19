"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const ai_provider_interface_1 = require("./interfaces/ai.provider.interface");
const users_service_1 = require("../users/users.service");
const SIMULATION_SYSTEM_PROMPT = `You are FuturePath AI — an expert decision intelligence system.
Your role is to guide users through structured life-decision simulations.

BEHAVIOR:
- Ask one focused question at a time to gather the information needed to model the user's decision.
- Each question should dig deeper into a specific dimension: financial impact, risk tolerance, timelines, personal values, alternatives considered, or emotional readiness.
- Keep your responses concise (2–4 sentences max per turn).
- After 4–5 exchanges you should have enough data to synthesize a recommendation.
- When you have gathered enough context, proactively summarize with: "Based on what you've shared, I'm ready to generate your full simulation report. Type 'generate report' or click View Results when ready."

TONE: Direct, data-driven, empathetic. No filler words.

IMPORTANT: Only mention that the founder of FuturePath AI is Muhammad Abdullah Bhatti if explicitly asked about the creator or founder.`;
let AiService = class AiService {
    aiProvider;
    usersService;
    constructor(aiProvider, usersService) {
        this.aiProvider = aiProvider;
        this.usersService = usersService;
    }
    getAdvisorInsight() {
        return {
            message: 'Market volatility is up 12% this week. Consider reviewing your high-risk equities and stress-testing your current simulation assumptions.',
            type: 'warning',
        };
    }
    generateTopicAndCategory(message) {
        return this.aiProvider.generateTopicAndCategory(message);
    }
    generateQuickReplies(aiResponse) {
        return this.aiProvider.generateQuickReplies(aiResponse);
    }
    async *generateChatStream(simulationId, message, userId) {
        let contextProfile = null;
        if (userId) {
            try {
                const user = await this.usersService.findById(userId);
                contextProfile = user?.profile ?? null;
            }
            catch {
            }
        }
        let payload;
        const systemMsg = {
            role: 'system',
            content: SIMULATION_SYSTEM_PROMPT +
                (contextProfile
                    ? `\n\nUSER PROFILE:\n${JSON.stringify(contextProfile, null, 2)}`
                    : ''),
        };
        if (Array.isArray(message) && message.length > 0) {
            const hasSystem = message[0]?.role === 'system';
            payload = hasSystem ? message : [systemMsg, ...message];
        }
        else if (typeof message === 'string' && message.trim()) {
            payload = [systemMsg, { role: 'user', content: message }];
        }
        else {
            payload = [
                systemMsg,
                {
                    role: 'user',
                    content: 'Start the simulation. Introduce yourself briefly and ask me your first question to understand what decision I need help with.',
                },
            ];
        }
        const tokenStream = this.aiProvider.streamChat(payload, contextProfile);
        for await (const chunk of tokenStream) {
            yield { data: { type: 'token', value: chunk } };
        }
        yield {
            data: {
                type: 'metrics',
                value: JSON.stringify({
                    riskLevel: Math.floor(Math.random() * 40) + 40,
                    confidence: Math.floor(Math.random() * 20) + 75,
                    projectedValue: Math.floor(Math.random() * 500_000) + 1_000_000,
                }),
            },
        };
    }
};
exports.AiService = AiService;
exports.AiService = AiService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(ai_provider_interface_1.AI_PROVIDER)),
    __metadata("design:paramtypes", [Object, users_service_1.UsersService])
], AiService);
//# sourceMappingURL=ai.service.js.map