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
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const report_repository_interface_1 = require("./interfaces/report.repository.interface");
const simulations_service_1 = require("../simulations/simulations.service");
const ai_provider_interface_1 = require("../ai/interfaces/ai.provider.interface");
const decision_engine_service_1 = require("../decision-engine/decision-engine.service");
const users_service_1 = require("../users/users.service");
let ReportsService = class ReportsService {
    reportRepo;
    simulationsService;
    aiProvider;
    decisionEngine;
    usersService;
    constructor(reportRepo, simulationsService, aiProvider, decisionEngine, usersService) {
        this.reportRepo = reportRepo;
        this.simulationsService = simulationsService;
        this.aiProvider = aiProvider;
        this.decisionEngine = decisionEngine;
        this.usersService = usersService;
    }
    async generateReport(userId, simulationId) {
        const simulation = await this.simulationsService.findOne(userId, simulationId);
        if (simulation.status !== 'COMPLETED') {
            throw new common_1.ForbiddenException('Simulation must be COMPLETED before generating a report. Call /analyze first.');
        }
        const existing = await this.reportRepo.findBySimulationId(simulationId);
        if (existing) {
            return existing;
        }
        const user = await this.usersService.findById(userId);
        const contextProfile = user?.profile;
        const fullReport = await this.aiProvider.generateFullReport(simulation.title, simulation.category, simulation.answers, contextProfile);
        const summary = fullReport.mostLikely?.description || 'AI Generated Report';
        const financialProjections = this.decisionEngine.generateFinancialProjections(simulation.answers);
        return this.reportRepo.create({
            simulationId,
            userId,
            summary,
            chartData: [
                {
                    chartType: 'line',
                    title: 'Financial Projections',
                    labels: financialProjections.labels,
                    series: financialProjections.series,
                },
            ],
            timeline: fullReport.timeline ||
                this.decisionEngine.generateTimeline(simulation.answers),
            scores: {
                decision: simulation.decisionScore || 0,
                risk: simulation.riskScore || 0,
                confidence: simulation.confidenceScore || 0,
            },
            recommendations: fullReport,
        });
    }
    async getReport(userId, reportId) {
        const report = await this.reportRepo.findById(reportId);
        if (!report) {
            throw new common_1.NotFoundException('Report not found');
        }
        if (report.userId !== userId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        return report;
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(report_repository_interface_1.REPORT_REPOSITORY)),
    __param(2, (0, common_1.Inject)(ai_provider_interface_1.AI_PROVIDER)),
    __metadata("design:paramtypes", [Object, simulations_service_1.SimulationsService, Object, decision_engine_service_1.DecisionEngineService,
        users_service_1.UsersService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map