"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockAIProvider = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
let MockAIProvider = class MockAIProvider {
    async generateQuestions(category) {
        return [
            {
                id: (0, crypto_1.randomUUID)(),
                text: `What is your primary goal for ${category}?`,
                type: 'text',
            },
            {
                id: (0, crypto_1.randomUUID)(),
                text: `What is your risk tolerance?`,
                type: 'select',
                options: ['Low', 'Medium', 'High'],
            },
        ];
    }
    async analyzeDecision(answers) {
        return { insights: ['Mock insight 1', 'Mock insight 2'] };
    }
    async compareScenarios(scenarios) {
        return { recommendation: scenarios[0] };
    }
    async generateSummary(answers) {
        return 'This is a mock AI-generated summary based on your answers.';
    }
    async generateRecommendations(answers) {
        return [
            { action: 'Save more', reasoning: 'Mock reasoning', priority: 'HIGH' },
            {
                action: 'Invest early',
                reasoning: 'Mock reasoning',
                priority: 'MEDIUM',
            },
        ];
    }
    async generateTopicAndCategory(message) {
        return {
            title: 'Mock Simulation Topic',
            category: 'PERSONAL',
        };
    }
    async generateFullReport(title, category, answers) {
        return {
            bestCase: {
                label: 'BEST CASE',
                probability: 22,
                title: 'Mock Best Case',
                description: 'Mock best case description.',
                salaryDelta: '+$165k',
                satisfaction: '9.2/10',
            },
            mostLikely: {
                label: 'MOST LIKELY',
                probability: 63,
                title: 'Mock Most Likely',
                description: 'Mock most likely description.',
                salaryDelta: '+$118k',
                satisfaction: '7.6/10',
            },
            worstCase: {
                label: 'WORST CASE',
                probability: 15,
                title: 'Mock Worst Case',
                description: 'Mock worst case description.',
                salaryDelta: '-$19k',
                satisfaction: '4.1/10',
            },
            rightReasons: ['Mock reason 1', 'Mock reason 2'],
            wrongReasons: ['Mock reason 3', 'Mock reason 4'],
            timeline: [
                { id: 't1', label: 'TODAY', sublabel: 'Decision' },
                { id: 't2', label: 'WEEK 1', sublabel: 'Action' },
            ],
            alternatives: [
                {
                    id: 'alt1',
                    title: 'Mock Alternative 1',
                    subtitle: 'Mock subtitle',
                    score: 61,
                },
            ],
        };
    }
    async *streamChat(message) {
        yield 'This is a mock chat response.';
    }
    async generateQuickReplies(aiResponse) {
        return ['Mock reply 1', 'Mock reply 2', 'Mock reply 3'];
    }
};
exports.MockAIProvider = MockAIProvider;
exports.MockAIProvider = MockAIProvider = __decorate([
    (0, common_1.Injectable)()
], MockAIProvider);
//# sourceMappingURL=mock-ai.provider.js.map