"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimulationsModule = void 0;
const common_1 = require("@nestjs/common");
const simulations_service_1 = require("./simulations.service");
const simulations_controller_1 = require("./simulations.controller");
const simulation_repository_interface_1 = require("./interfaces/simulation.repository.interface");
const prisma_simulation_repository_1 = require("./repositories/prisma-simulation.repository");
const ai_module_1 = require("../ai/ai.module");
const decision_engine_module_1 = require("../decision-engine/decision-engine.module");
let SimulationsModule = class SimulationsModule {
};
exports.SimulationsModule = SimulationsModule;
exports.SimulationsModule = SimulationsModule = __decorate([
    (0, common_1.Module)({
        imports: [ai_module_1.AiModule, decision_engine_module_1.DecisionEngineModule],
        controllers: [simulations_controller_1.SimulationsController],
        providers: [
            simulations_service_1.SimulationsService,
            {
                provide: simulation_repository_interface_1.SIMULATION_REPOSITORY,
                useClass: prisma_simulation_repository_1.PrismaSimulationRepository,
            },
        ],
        exports: [simulations_service_1.SimulationsService],
    })
], SimulationsModule);
//# sourceMappingURL=simulations.module.js.map