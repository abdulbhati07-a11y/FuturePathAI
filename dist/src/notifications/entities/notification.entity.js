"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationEntity = void 0;
const base_entity_1 = require("../../common/entities/base.entity");
class NotificationEntity extends base_entity_1.BaseEntity {
    userId;
    type;
    title;
    message;
    isRead;
    metadata;
}
exports.NotificationEntity = NotificationEntity;
//# sourceMappingURL=notification.entity.js.map