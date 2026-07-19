import { NotificationEntity } from '../entities/notification.entity';

export const NOTIFICATION_CHANNEL = Symbol('NOTIFICATION_CHANNEL');

export interface INotificationChannel {
  send(notification: NotificationEntity): Promise<boolean>;
}
