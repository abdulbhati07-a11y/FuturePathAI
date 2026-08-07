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
exports.AiController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const ai_service_1 = require("./ai.service");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
class ChatMessageDto {
    role;
    content;
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ChatMessageDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ChatMessageDto.prototype, "content", void 0);
class ChatRequestDto {
    message;
    messages;
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ChatRequestDto.prototype, "message", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ChatMessageDto),
    __metadata("design:type", Array)
], ChatRequestDto.prototype, "messages", void 0);
let AiController = class AiController {
    aiService;
    constructor(aiService) {
        this.aiService = aiService;
    }
    getAdvisorInsight() {
        return this.aiService.getAdvisorInsight();
    }
    generateTopic(message) {
        return this.aiService.generateTopicAndCategory(message || '');
    }
    chatStream(simulationId, body, user, res) {
        const userId = user?.id || user?.userId;
        const payload = body.messages && body.messages.length > 0
            ? body.messages
            : (body.message ?? '');
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders();
        const send = (type, value) => {
            if (!res.writableEnded) {
                res.write(`data: ${JSON.stringify({ type, value })}\n\n`);
                if (typeof res.flush === 'function')
                    res.flush();
            }
        };
        (async () => {
            try {
                const stream = this.aiService.generateChatStream(simulationId, payload, userId);
                let fullResponse = '';
                for await (const event of stream) {
                    if (event.data.type === 'token') {
                        fullResponse += event.data.value;
                    }
                    send(event.data.type, event.data.value);
                }
                let dynamicSuggestions = [
                    'Tell me more about the risks',
                    'What is the best-case scenario?',
                    'How does this compare to alternatives?',
                    'What should I do next?',
                ];
                const parsedOptions = fullResponse
                    ? Array.from(fullResponse.matchAll(/^\s*([A-F])[).]\s+(.{1,80}?)\s*$/gm), (m) => m[2])
                    : [];
                if (parsedOptions.length >= 2) {
                    dynamicSuggestions = parsedOptions.slice(0, 6);
                }
                else {
                    try {
                        if (fullResponse) {
                            const replies = await this.aiService.generateQuickReplies(fullResponse);
                            if (replies && replies.length > 0) {
                                dynamicSuggestions = replies;
                            }
                        }
                    }
                    catch (err) {
                        console.error('Failed to generate dynamic suggestions:', err);
                    }
                }
                if (!res.writableEnded) {
                    send('suggestions', dynamicSuggestions);
                    send('insight', {
                        label: 'LIVE PATH INSIGHT',
                        message: 'Your responses are shaping the probability model. Keep answering to improve accuracy.',
                    });
                    send('done', '');
                }
            }
            catch (err) {
                send('error', err.message || 'Stream failed');
            }
            finally {
                if (!res.writableEnded)
                    res.end();
            }
        })();
    }
};
exports.AiController = AiController;
__decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.Get)('advisor-insight'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current AI advisor insight' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AiController.prototype, "getAdvisorInsight", null);
__decorate([
    (0, throttler_1.Throttle)({ 'ai-topic': { ttl: 60_000, limit: 20 } }),
    (0, common_1.Post)('generate-topic'),
    (0, swagger_1.ApiOperation)({ summary: 'Generate a simulation topic from a chat message' }),
    __param(0, (0, common_1.Body)('message')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "generateTopic", null);
__decorate([
    (0, throttler_1.Throttle)({ 'ai-chat': { ttl: 60_000, limit: 10 } }),
    (0, common_1.Post)('simulations/:id/chat'),
    (0, swagger_1.ApiOperation)({ summary: 'Stream AI chat for a simulation (SSE)' }),
    (0, swagger_1.ApiBody)({ type: ChatRequestDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ChatRequestDto, Object, Object]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "chatStream", null);
exports.AiController = AiController = __decorate([
    (0, swagger_1.ApiTags)('AI'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('ai'),
    __metadata("design:paramtypes", [ai_service_1.AiService])
], AiController);
//# sourceMappingURL=ai.controller.js.map