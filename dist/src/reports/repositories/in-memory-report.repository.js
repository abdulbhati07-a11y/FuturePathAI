"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryReportRepository = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
let InMemoryReportRepository = class InMemoryReportRepository {
    reports = new Map();
    async findById(id) {
        return this.reports.get(id) || null;
    }
    async findBySimulationId(simulationId) {
        for (const report of this.reports.values()) {
            if (report.simulationId === simulationId) {
                return report;
            }
        }
        return null;
    }
    async create(report) {
        const newReport = {
            id: (0, crypto_1.randomUUID)(),
            simulationId: report.simulationId,
            userId: report.userId,
            summary: report.summary || '',
            chartData: report.chartData || [],
            timeline: report.timeline || [],
            scores: report.scores || { decision: 0, risk: 0, confidence: 0 },
            recommendations: report.recommendations || [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.reports.set(newReport.id, newReport);
        return newReport;
    }
    async delete(id) {
        return this.reports.delete(id);
    }
};
exports.InMemoryReportRepository = InMemoryReportRepository;
exports.InMemoryReportRepository = InMemoryReportRepository = __decorate([
    (0, common_1.Injectable)()
], InMemoryReportRepository);
//# sourceMappingURL=in-memory-report.repository.js.map