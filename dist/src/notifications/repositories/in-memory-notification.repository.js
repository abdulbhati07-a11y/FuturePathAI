"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryNotificationRepository = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
let InMemoryNotificationRepository = class InMemoryNotificationRepository {
    notifications = new Map();
    async findByUserId(userId) {
        const results = [];
        for (const notif of this.notifications.values()) {
            if (notif.userId === userId) {
                results.push(notif);
            }
        }
        return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    async create(notification) {
        const newNotif = {
            id: (0, crypto_1.randomUUID)(),
            userId: notification.userId,
            type: notification.type || 'SYSTEM',
            title: notification.title || '',
            message: notification.message || '',
            isRead: false,
            metadata: notification.metadata,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.notifications.set(newNotif.id, newNotif);
        return newNotif;
    }
    async markAsRead(id) {
        const notif = this.notifications.get(id);
        if (!notif)
            return false;
        notif.isRead = true;
        notif.updatedAt = new Date();
        return true;
    }
};
exports.InMemoryNotificationRepository = InMemoryNotificationRepository;
exports.InMemoryNotificationRepository = InMemoryNotificationRepository = __decorate([
    (0, common_1.Injectable)()
], InMemoryNotificationRepository);
//# sourceMappingURL=in-memory-notification.repository.js.map