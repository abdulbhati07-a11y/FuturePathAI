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
exports.UpdateSimulationDto = exports.CreateSimulationDto = exports.SimulationStatus = exports.SimulationCategory = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
var SimulationCategory;
(function (SimulationCategory) {
    SimulationCategory["CAREER"] = "CAREER";
    SimulationCategory["FINANCIAL"] = "FINANCIAL";
    SimulationCategory["PERSONAL"] = "PERSONAL";
    SimulationCategory["BUSINESS"] = "BUSINESS";
    SimulationCategory["HEALTH"] = "HEALTH";
    SimulationCategory["EDUCATION"] = "EDUCATION";
})(SimulationCategory || (exports.SimulationCategory = SimulationCategory = {}));
var SimulationStatus;
(function (SimulationStatus) {
    SimulationStatus["DRAFT"] = "DRAFT";
    SimulationStatus["IN_PROGRESS"] = "IN_PROGRESS";
    SimulationStatus["COMPLETED"] = "COMPLETED";
    SimulationStatus["ARCHIVED"] = "ARCHIVED";
})(SimulationStatus || (exports.SimulationStatus = SimulationStatus = {}));
class CreateSimulationDto {
    title;
    category;
}
exports.CreateSimulationDto = CreateSimulationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'My Career Move' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSimulationDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: SimulationCategory }),
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? value.toUpperCase() : value),
    (0, class_validator_1.IsEnum)(SimulationCategory),
    __metadata("design:type", String)
], CreateSimulationDto.prototype, "category", void 0);
class UpdateSimulationDto {
    title;
    category;
    status;
    answers;
}
exports.UpdateSimulationDto = UpdateSimulationDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSimulationDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: SimulationCategory }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? value.toUpperCase() : value),
    (0, class_validator_1.IsEnum)(SimulationCategory),
    __metadata("design:type", String)
], UpdateSimulationDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: SimulationStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(SimulationStatus),
    __metadata("design:type", String)
], UpdateSimulationDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], UpdateSimulationDto.prototype, "answers", void 0);
//# sourceMappingURL=simulation.dto.js.map