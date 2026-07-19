"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecisionEngineService = void 0;
const common_1 = require("@nestjs/common");
let DecisionEngineService = class DecisionEngineService {
    calculateScores(answers) {
        return {
            decisionScore: Math.floor(Math.random() * 40) + 60,
            riskScore: Math.floor(Math.random() * 50) + 10,
            confidenceScore: Math.floor(Math.random() * 30) + 70,
        };
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
exports.DecisionEngineService = DecisionEngineService = __decorate([
    (0, common_1.Injectable)()
], DecisionEngineService);
//# sourceMappingURL=decision-engine.service.js.map