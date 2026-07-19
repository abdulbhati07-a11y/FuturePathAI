import { INotificationRepository } from '../interfaces/notification.repository.interface';
import { NotificationEntity } from '../entities/notification.entity';
export declare class InMemoryNotificationRepository implements INotificationRepository {
    private notifications;
    findByUserId(userId: string): Promise<NotificationEntity[]>;
    create(notification: Partial<NotificationEntity>): Promise<NotificationEntity>;
    markAsRead(id: string): Promise<boolean>;
}
