import { INotificationChannel } from '../interfaces/notification.channel.interface';
import { NotificationEntity } from '../entities/notification.entity';
export declare class MockNotificationChannel implements INotificationChannel {
    private readonly logger;
    send(notification: NotificationEntity): Promise<boolean>;
}
