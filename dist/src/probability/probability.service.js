"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProbabilityService = void 0;
const common_1 = require("@nestjs/common");
let ProbabilityService = class ProbabilityService {
    calculateProbabilities(answers) {
        return {
            bestCase: 'Highly favorable outcome based on answers.',
            worstCase: 'Potential challenges require mitigation.',
            mostLikely: 'Steady progress towards goal.',
            confidencePercent: Math.floor(Math.random() * 30) + 70,
            riskPercent: Math.floor(Math.random() * 50) + 10,
        };
    }
};
exports.ProbabilityService = ProbabilityService;
exports.ProbabilityService = ProbabilityService = __decorate([
    (0, common_1.Injectable)()
], ProbabilityService);
//# sourceMappingURL=probability.service.js.map