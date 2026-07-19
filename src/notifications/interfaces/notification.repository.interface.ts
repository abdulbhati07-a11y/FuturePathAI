import { NotificationEntity } from '../entities/notification.entity';

export const NOTIFICATION_REPOSITORY = Symbol('NOTIFICATION_REPOSITORY');

export interface INotificationRepository {
  findByUserId(userId: string): Promise<NotificationEntity[]>;
  create(
    notification: Partial<NotificationEntity>,
  ): Promise<NotificationEntity>;
  markAsRead(id: string): Promise<boolean>;
}
