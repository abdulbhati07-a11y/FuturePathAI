"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserEntity = void 0;
const base_entity_1 = require("../../common/entities/base.entity");
class UserEntity extends base_entity_1.BaseEntity {
    email;
    passwordHash;
    name;
    roles;
    profile;
}
exports.UserEntity = UserEntity;
//# sourceMappingURL=user.entity.js.map