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
exports.PrismaSimulationRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const simulation_dto_1 = require("../dto/simulation.dto");
let PrismaSimulationRepository = class PrismaSimulationRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        const sim = await this.prisma.simulation.findUnique({ where: { id } });
        return sim ? this.mapToEntity(sim) : null;
    }
    async findAll(filters) {
        const where = {};
        if (filters.userId)
            where.userId = filters.userId;
        if (filters.category)
            where.category = filters.category;
        if (filters.status)
            where.status = filters.status;
        const [data, total] = await Promise.all([
            this.prisma.simulation.findMany({
                where,
                skip: (filters.page - 1) * filters.limit,
                take: filters.limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.simulation.count({ where }),
        ]);
        return { data: data.map((s) => this.mapToEntity(s)), total };
    }
    async create(simulation) {
        const created = await this.prisma.simulation.create({
            data: {
                id: simulation.id,
                userId: simulation.userId,
                title: simulation.title,
                category: simulation.category,
                status: (simulation.status || simulation_dto_1.SimulationStatus.DRAFT),
                answers: (simulation.answers || {}),
                generatedQuestions: (simulation.generatedQuestions || []),
                decisionScore: simulation.decisionScore,
                riskScore: simulation.riskScore,
                confidenceScore: simulation.confidenceScore,
                isPublic: simulation.isPublic ?? false,
                ...(simulation.updatedAt && { updatedAt: simulation.updatedAt }),
            },
        });
        return this.mapToEntity(created);
    }
    async update(id, simulation) {
        const updated = await this.prisma.simulation.update({
            where: { id },
            data: {
                ...(simulation.title && { title: simulation.title }),
                ...(simulation.category && { category: simulation.category }),
                ...(simulation.status && { status: simulation.status }),
                ...(simulation.answers !== undefined && {
                    answers: simulation.answers,
                }),
                ...(simulation.generatedQuestions !== undefined && {
                    generatedQuestions: simulation.generatedQuestions,
                }),
                ...(simulation.decisionScore !== undefined && {
                    decisionScore: simulation.decisionScore,
                }),
                ...(simulation.riskScore !== undefined && {
                    riskScore: simulation.riskScore,
                }),
                ...(simulation.confidenceScore !== undefined && {
                    confidenceScore: simulation.confidenceScore,
                }),
                ...(simulation.isPublic !== undefined && {
                    isPublic: simulation.isPublic,
                }),
            },
        });
        return this.mapToEntity(updated);
    }
    async delete(id) {
        try {
            await this.prisma.simulation.delete({ where: { id } });
            return true;
        }
        catch {
            return false;
        }
    }
    mapToEntity(sim) {
        return {
            id: sim.id,
            userId: sim.userId,
            title: sim.title,
            category: sim.category,
            status: sim.status,
            answers: (sim.answers ?? {}),
            generatedQuestions: (sim.generatedQuestions ?? []),
            decisionScore: sim.decisionScore,
            riskScore: sim.riskScore,
            confidenceScore: sim.confidenceScore,
            isPublic: sim.isPublic,
            createdAt: sim.createdAt,
            updatedAt: sim.updatedAt,
        };
    }
};
exports.PrismaSimulationRepository = PrismaSimulationRepository;
exports.PrismaSimulationRepository = PrismaSimulationRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaSimulationRepository);
//# sourceMappingURL=prisma-simulation.repository.js.map