"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var DecisionEngineService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecisionEngineService = void 0;
const common_1 = require("@nestjs/common");
let DecisionEngineService = class DecisionEngineService {
    static { DecisionEngineService_1 = this; }
    static RISK_WORDS = [
        'debt',
        'loan',
        'borrow',
        'quit',
        'risky',
        'risk',
        'uncertain',
        'gamble',
        'volatile',
        'laid off',
        'fired',
        'lose',
        'loss',
        'fear',
        'worried',
        'worry',
        'anxious',
        'unstable',
        'no savings',
        'broke',
        'mortgage',
        'deficit',
        'overdraft',
        'bankrupt',
        'stress',
        'desperate',
        'all in',
    ];
    static SAFE_WORDS = [
        'savings',
        'saved',
        'buffer',
        'emergency fund',
        'stable',
        'secure',
        'diversified',
        'runway',
        'insurance',
        'steady',
        'guaranteed',
        'profit',
        'surplus',
        'experience',
        'skilled',
        'confident',
        'backup',
        'safety net',
        'low risk',
        'passive income',
        'stable income',
    ];
    calculateScores(answers) {
        const { text, userTurns } = this.extractConversation(answers);
        const normalized = text.toLowerCase().trim();
        if (!normalized) {
            return { decisionScore: 70, riskScore: 40, confidenceScore: 65 };
        }
        const numberHits = (normalized.match(/\d+/g) || []).length;
        const moneyHits = (normalized.match(/\$/g) || []).length;
        const timeHits = (normalized.match(/\b(year|month|week|day|quarter)s?\b/g) || []).length;
        const concreteness = Math.min(numberHits + moneyHits * 2 + timeHits, 12);
        const riskHits = this.countHits(normalized, DecisionEngineService_1.RISK_WORDS);
        const safeHits = this.countHits(normalized, DecisionEngineService_1.SAFE_WORDS);
        const confidenceScore = this.clamp(Math.round(70 + userTurns * 4 + concreteness * 1.5), 70, 98);
        const riskScore = this.clamp(Math.round(30 + riskHits * 6 - safeHits * 5), 8, 80);
        const decisionScore = this.clamp(Math.round(100 - riskScore * 0.5 + (confidenceScore - 70) * 0.3), 55, 99);
        return { decisionScore, riskScore, confidenceScore };
    }
    extractConversation(answers) {
        if (!answers || typeof answers !== 'object') {
            return { text: '', userTurns: 0 };
        }
        const convo = answers.conversation;
        if (Array.isArray(convo) && convo.length > 0) {
            const userTurns = convo.filter((m) => m?.role === 'user').length;
            const text = convo
                .map((m) => (typeof m?.content === 'string' ? m.content : ''))
                .join(' ');
            return { text, userTurns };
        }
        try {
            return { text: JSON.stringify(answers), userTurns: 0 };
        }
        catch {
            return { text: '', userTurns: 0 };
        }
    }
    countHits(text, words) {
        let hits = 0;
        for (const word of words) {
            const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const matches = text.match(new RegExp(escaped, 'g'));
            if (matches)
                hits += matches.length;
        }
        return hits;
    }
    clamp(n, min, max) {
        return Math.max(min, Math.min(max, n));
    }
    generateFinancialProjections(answers) {
        return {
            labels: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'],
            series: [{ name: 'Projected Value', data: [100, 150, 200, 280, 400] }],
        };
    }
    generateTimeline(answers) {
        return [
            { year: new Date().getFullYear(), milestone: 'Start', impact: 'Neutral' },
            {
                year: new Date().getFullYear() + 2,
                milestone: 'Growth Phase',
                impact: 'Positive',
            },
        ];
    }
};
exports.DecisionEngineService = DecisionEngineService;
exports.DecisionEngineService = DecisionEngineService = DecisionEngineService_1 = __decorate([
    (0, common_1.Injectable)()
], DecisionEngineService);
//# sourceMappingURL=decision-engine.service.js.map