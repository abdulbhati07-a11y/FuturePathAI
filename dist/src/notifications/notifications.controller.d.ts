import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    findAll(user: any): Promise<import("./entities/notification.entity").NotificationEntity[]>;
    markAsRead(id: string): Promise<boolean>;
}
