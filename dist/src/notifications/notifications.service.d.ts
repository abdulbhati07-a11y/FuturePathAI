import type { INotificationRepository } from './interfaces/notification.repository.interface';
import type { INotificationChannel } from './interfaces/notification.channel.interface';
import { NotificationEntity } from './entities/notification.entity';
export declare class NotificationsService {
    private readonly notificationRepo;
    private readonly notificationChannel;
    constructor(notificationRepo: INotificationRepository, notificationChannel: INotificationChannel);
    getUserNotifications(userId: string): Promise<NotificationEntity[]>;
    markAsRead(id: string): Promise<boolean>;
    notifyUser(userId: string, title: string, message: string, type?: string): Promise<NotificationEntity>;
}
