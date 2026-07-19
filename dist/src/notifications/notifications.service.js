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
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const notification_repository_interface_1 = require("./interfaces/notification.repository.interface");
const notification_channel_interface_1 = require("./interfaces/notification.channel.interface");
let NotificationsService = class NotificationsService {
    notificationRepo;
    notificationChannel;
    constructor(notificationRepo, notificationChannel) {
        this.notificationRepo = notificationRepo;
        this.notificationChannel = notificationChannel;
    }
    async getUserNotifications(userId) {
        return this.notificationRepo.findByUserId(userId);
    }
    async markAsRead(id) {
        return this.notificationRepo.markAsRead(id);
    }
    async notifyUser(userId, title, message, type = 'SYSTEM') {
        const notification = await this.notificationRepo.create({
            userId,
            title,
            message,
            type,
        });
        await this.notificationChannel.send(notification);
        return notification;
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(notification_repository_interface_1.NOTIFICATION_REPOSITORY)),
    __param(1, (0, common_1.Inject)(notification_channel_interface_1.NOTIFICATION_CHANNEL)),
    __metadata("design:paramtypes", [Object, Object])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map