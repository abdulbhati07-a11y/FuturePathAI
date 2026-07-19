"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemorySimulationRepository = void 0;
const common_1 = require("@nestjs/common");
const simulation_dto_1 = require("../dto/simulation.dto");
const crypto_1 = require("crypto");
let InMemorySimulationRepository = class InMemorySimulationRepository {
    simulations = new Map();
    async findById(id) {
        return this.simulations.get(id) || null;
    }
    async findAll(filters) {
        let results = Array.from(this.simulations.values());
        if (filters.userId) {
            results = results.filter((s) => s.userId === filters.userId);
        }
        if (filters.category) {
            results = results.filter((s) => s.category === filters.category);
        }
        if (filters.status) {
            results = results.filter((s) => s.status === filters.status);
        }
        const total = results.length;
        const start = (filters.page - 1) * filters.limit;
        const end = start + filters.limit;
        const paginatedData = results.slice(start, end);
        return { data: paginatedData, total };
    }
    async create(simulation) {
        const newSim = {
            id: (0, crypto_1.randomUUID)(),
            userId: simulation.userId,
            title: simulation.title,
            category: simulation.category,
            status: simulation.status || simulation_dto_1.SimulationStatus.DRAFT,
            answers: simulation.answers || {},
            generatedQuestions: simulation.generatedQuestions || [],
            decisionScore: simulation.decisionScore || null,
            riskScore: simulation.riskScore || null,
            confidenceScore: simulation.confidenceScore || null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.simulations.set(newSim.id, newSim);
        return newSim;
    }
    async update(id, simulationUpdate) {
        const sim = this.simulations.get(id);
        if (!sim)
            return null;
        const updatedSim = { ...sim, ...simulationUpdate, updatedAt: new Date() };
        this.simulations.set(id, updatedSim);
        return updatedSim;
    }
    async delete(id) {
        return this.simulations.delete(id);
    }
};
exports.InMemorySimulationRepository = InMemorySimulationRepository;
exports.InMemorySimulationRepository = InMemorySimulationRepository = __decorate([
    (0, common_1.Injectable)()
], InMemorySimulationRepository);
//# sourceMappingURL=in-memory-simulation.repository.js.map