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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaReportRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let PrismaReportRepository = class PrismaReportRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        const report = await this.prisma.report.findUnique({ where: { id } });
        return report ? this.mapToEntity(report) : null;
    }
    async findBySimulationId(simulationId) {
        const report = await this.prisma.report.findUnique({
            where: { simulationId },
        });
        return report ? this.mapToEntity(report) : null;
    }
    async create(report) {
        const created = await this.prisma.report.create({
            data: {
                simulationId: report.simulationId,
                userId: report.userId,
                summary: report.summary || '',
                chartData: (report.chartData || []),
                timeline: (report.timeline || []),
                scores: (report.scores || {
                    decision: 0,
                    risk: 0,
                    confidence: 0,
                }),
                recommendations: (report.recommendations || []),
            },
        });
        return this.mapToEntity(created);
    }
    async delete(id) {
        try {
            await this.prisma.report.delete({ where: { id } });
            return true;
        }
        catch {
            return false;
        }
    }
    mapToEntity(report) {
        return {
            id: report.id,
            simulationId: report.simulationId,
            userId: report.userId,
            summary: report.summary,
            chartData: report.chartData,
            timeline: report.timeline,
            scores: report.scores,
            recommendations: report.recommendations,
            createdAt: report.createdAt,
            updatedAt: report.updatedAt,
        };
    }
};
exports.PrismaReportRepository = PrismaReportRepository;
exports.PrismaReportRepository = PrismaReportRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaReportRepository);
//# sourceMappingURL=prisma-report.repository.js.map