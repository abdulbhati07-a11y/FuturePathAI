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
exports.SimulationsController = void 0;
const common_1 = require("@nestjs/common");
const simulations_service_1 = require("./simulations.service");
const simulation_dto_1 = require("./dto/simulation.dto");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let SimulationsController = class SimulationsController {
    simulationsService;
    constructor(simulationsService) {
        this.simulationsService = simulationsService;
    }
    getUserId(user) {
        return user?.id || user?.userId || 'seed-user-id';
    }
    create(user, createSimulationDto) {
        return this.simulationsService.create(this.getUserId(user), createSimulationDto);
    }
    findPublic() {
        return this.simulationsService.findPublic();
    }
    findAll(user, query) {
        return this.simulationsService.findAll(this.getUserId(user), query);
    }
    findOne(user, id) {
        return this.simulationsService.findOne(this.getUserId(user), id);
    }
    update(user, id, updateSimulationDto) {
        return this.simulationsService.update(this.getUserId(user), id, updateSimulationDto);
    }
    togglePublic(user, id, isPublic) {
        return this.simulationsService.togglePublic(this.getUserId(user), id, isPublic);
    }
    remove(user, id) {
        return this.simulationsService.delete(this.getUserId(user), id);
    }
    getResults(user, id) {
        return this.simulationsService.getResults(this.getUserId(user), id);
    }
    analyze(user, id) {
        return this.simulationsService.analyze(this.getUserId(user), id);
    }
};
exports.SimulationsController = SimulationsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new simulation' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, simulation_dto_1.CreateSimulationDto]),
    __metadata("design:returntype", void 0)
], SimulationsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('public'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all public simulations' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SimulationsController.prototype, "findPublic", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all simulations for current user (paginated)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], SimulationsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a simulation by id' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SimulationsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a simulation (e.g. answer questions)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, simulation_dto_1.UpdateSimulationDto]),
    __metadata("design:returntype", void 0)
], SimulationsController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/public'),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle public visibility of a simulation' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('isPublic')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Boolean]),
    __metadata("design:returntype", void 0)
], SimulationsController.prototype, "togglePublic", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a simulation' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SimulationsController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':id/results'),
    (0, swagger_1.ApiOperation)({ summary: 'Get simulation results' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SimulationsController.prototype, "getResults", null);
__decorate([
    (0, common_1.Post)(':id/analyze'),
    (0, swagger_1.ApiOperation)({ summary: 'Trigger AI & Decision Engine analysis' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SimulationsController.prototype, "analyze", null);
exports.SimulationsController = SimulationsController = __decorate([
    (0, swagger_1.ApiTags)('Simulations'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('simulations'),
    __metadata("design:paramtypes", [simulations_service_1.SimulationsService])
], SimulationsController);
//# sourceMappingURL=simulations.controller.js.map