"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimulationEntity = void 0;
const base_entity_1 = require("../../common/entities/base.entity");
class SimulationEntity extends base_entity_1.BaseEntity {
    userId;
    title;
    category;
    status;
    answers;
    generatedQuestions;
    decisionScore;
    riskScore;
    confidenceScore;
    isPublic;
}
exports.SimulationEntity = SimulationEntity;
//# sourceMappingURL=simulation.entity.js.map