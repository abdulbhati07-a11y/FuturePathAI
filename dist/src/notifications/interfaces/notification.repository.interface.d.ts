import { NotificationEntity } from '../entities/notification.entity';
export declare const NOTIFICATION_REPOSITORY: unique symbol;
export interface INotificationRepository {
    findByUserId(userId: string): Promise<NotificationEntity[]>;
    create(notification: Partial<NotificationEntity>): Promise<NotificationEntity>;
    markAsRead(id: string): Promise<boolean>;
}
