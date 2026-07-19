"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
let AnalyticsService = class AnalyticsService {
    getDashboardStats() {
        return {
            stabilityIndex: { value: 84.2, unit: '%', trend: 'up' },
            riskVector: { value: 12.5, unit: 'pts', label: 'Low', trend: 'down' },
            projectedCapital: { value: 1.4, unit: 'M', prefix: '$' },
            pathAlpha: { value: 26, label: 'A/B', trend: 'up' },
        };
    }
    getMarketCorrelation() {
        return [
            {
                id: 'm1',
                label: 'S&P 500 Index',
                changePercent: 1.24,
                direction: 'up',
            },
            {
                id: 'm2',
                label: 'Interest Rate (Sim)',
                changePercent: -5.25,
                direction: 'down',
            },
        ];
    }
    getSystemMeta() {
        return {
            simulationUptime: 99.98,
            lastRecalc: '82:45m ago',
        };
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)()
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map