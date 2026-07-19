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
exports.SimulationsService = void 0;
const common_1 = require("@nestjs/common");
const simulation_repository_interface_1 = require("./interfaces/simulation.repository.interface");
const simulation_dto_1 = require("./dto/simulation.dto");
const ai_provider_interface_1 = require("../ai/interfaces/ai.provider.interface");
const decision_engine_service_1 = require("../decision-engine/decision-engine.service");
const prisma_service_1 = require("../common/prisma/prisma.service");
let SimulationsService = class SimulationsService {
    simulationRepo;
    aiProvider;
    decisionEngine;
    prisma;
    constructor(simulationRepo, aiProvider, decisionEngine, prisma) {
        this.simulationRepo = simulationRepo;
        this.aiProvider = aiProvider;
        this.decisionEngine = decisionEngine;
        this.prisma = prisma;
    }
    async onModuleInit() {
        const { total } = await this.simulationRepo.findAll({ page: 1, limit: 1 });
        if (total === 0) {
            const seedUserId = 'seed-user-id';
            await this.prisma.user.upsert({
                where: { id: seedUserId },
                update: {},
                create: {
                    id: seedUserId,
                    email: 'seed@futurepath.ai',
                    passwordHash: 'seed-password-hash',
                    name: 'Demo User',
                },
            });
            await this.simulationRepo.create({
                id: 'sim_1',
                userId: seedUserId,
                title: 'Series C Equity Liquidate',
                category: 'FINANCIAL',
                status: simulation_dto_1.SimulationStatus.COMPLETED,
                riskScore: 14,
                confidenceScore: 98.2,
                decisionScore: 95,
                updatedAt: new Date('2024-10-12'),
            });
            await this.simulationRepo.create({
                id: 'sim_2',
                userId: seedUserId,
                title: 'Primary Residence Pivot',
                category: 'PERSONAL',
                status: simulation_dto_1.SimulationStatus.IN_PROGRESS,
                riskScore: 42,
                confidenceScore: 76.4,
                decisionScore: 82,
                updatedAt: new Date('2024-10-09'),
            });
        }
    }
    async create(userId, createDto) {
        const generatedQuestions = await this.aiProvider.generateQuestions(createDto.category);
        return this.simulationRepo.create({
            userId,
            title: createDto.title,
            category: createDto.category,
            status: simulation_dto_1.SimulationStatus.DRAFT,
            answers: {},
            generatedQuestions,
        });
    }
    async findAll(userId, query) {
        const page = parseInt(query.page, 10) || 1;
        const limit = parseInt(query.limit, 10) || 10;
        const result = await this.simulationRepo.findAll({
            userId,
            category: query.category,
            status: query.status,
            page,
            limit,
        });
        return {
            data: result.data.map((sim) => this.mapToFrontendDto(sim)),
            meta: {
                total: result.total,
                page,
                limit,
            },
        };
    }
    mapToFrontendDto(sim) {
        return {
            id: sim.id,
            title: sim.title,
            category: sim.category,
            status: sim.status,
            riskLevel: sim.riskScore
                ? sim.riskScore < 30
                    ? 'Low'
                    : sim.riskScore < 70
                        ? 'Med'
                        : 'High'
                : 'Unknown',
            riskPercent: sim.riskScore || 0,
            confidenceScore: sim.confidenceScore || 0,
            decisionGrade: sim.decisionScore
                ? sim.decisionScore > 90
                    ? 'A+'
                    : sim.decisionScore > 80
                        ? 'A'
                        : 'B'
                : 'N/A',
            statusTag: sim.status === simulation_dto_1.SimulationStatus.COMPLETED
                ? 'SAFE PATH'
                : 'PENDING ACTION',
            updatedAt: sim.updatedAt,
            decisionScore: sim.decisionScore,
            riskScore: sim.riskScore,
            isPublic: sim.isPublic,
        };
    }
    async findPublic() {
        const publicSims = await this.prisma.simulation.findMany({
            where: { isPublic: true },
            include: {
                user: { select: { name: true, profile: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        return publicSims.map((sim) => ({
            ...this.mapToFrontendDto(sim),
            authorName: sim.user?.name || 'Anonymous',
            authorProfile: sim.user?.profile || null,
        }));
    }
    async findOne(userId, id) {
        const simulation = await this.simulationRepo.findById(id);
        if (!simulation) {
            throw new common_1.NotFoundException('Simulation not found');
        }
        if (simulation.userId !== userId) {
            throw new common_1.ForbiddenException('You do not have access to this simulation');
        }
        return simulation;
    }
    async update(userId, id, updateDto) {
        const simulation = await this.findOne(userId, id);
        const updates = { ...updateDto };
        if (updateDto.answers) {
            updates.status = simulation_dto_1.SimulationStatus.IN_PROGRESS;
            updates.decisionScore = null;
            updates.riskScore = null;
            updates.confidenceScore = null;
        }
        return this.simulationRepo.update(id, updates);
    }
    async togglePublic(userId, id, isPublic) {
        const simulation = await this.findOne(userId, id);
        return this.simulationRepo.update(id, { isPublic });
    }
    async delete(userId, id) {
        await this.findOne(userId, id);
        return this.simulationRepo.delete(id);
    }
    async analyze(userId, id) {
        const simulation = await this.findOne(userId, id);
        const scores = this.decisionEngine.calculateScores(simulation.answers);
        return this.simulationRepo.update(id, {
            decisionScore: scores.decisionScore,
            riskScore: scores.riskScore,
            confidenceScore: scores.confidenceScore,
            status: simulation_dto_1.SimulationStatus.COMPLETED,
        });
    }
    async getResults(userId, id) {
        const simulation = await this.findOne(userId, id);
        const report = await this.prisma.report.findUnique({
            where: { simulationId: id },
        });
        if (!report) {
            throw new common_1.NotFoundException('Report not generated yet for this simulation');
        }
        const aiData = report.recommendations || {};
        return {
            id: simulation.id,
            title: simulation.title,
            isPublic: simulation.isPublic,
            finalizedDate: report.updatedAt.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            }),
            overallRisk: simulation.riskScore
                ? simulation.riskScore < 30
                    ? 'Low'
                    : simulation.riskScore < 70
                        ? 'Moderate'
                        : 'High'
                : 'Moderate',
            riskLabel: 'Determined by AI',
            confidence: simulation.confidenceScore || 94,
            bestCase: aiData.bestCase,
            mostLikely: aiData.mostLikely,
            worstCase: aiData.worstCase,
            rightReasons: aiData.rightReasons || [],
            wrongReasons: aiData.wrongReasons || [],
            timeline: report.timeline || aiData.timeline || [],
            alternatives: aiData.alternatives || [],
        };
    }
};
exports.SimulationsService = SimulationsService;
exports.SimulationsService = SimulationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(simulation_repository_interface_1.SIMULATION_REPOSITORY)),
    __param(1, (0, common_1.Inject)(ai_provider_interface_1.AI_PROVIDER)),
    __metadata("design:paramtypes", [Object, Object, decision_engine_service_1.DecisionEngineService,
        prisma_service_1.PrismaService])
], SimulationsService);
//# sourceMappingURL=simulations.service.js.map