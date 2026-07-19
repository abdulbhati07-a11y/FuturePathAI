import { NotificationEntity } from '../entities/notification.entity';
export declare const NOTIFICATION_CHANNEL: unique symbol;
export interface INotificationChannel {
    send(notification: NotificationEntity): Promise<boolean>;
}
