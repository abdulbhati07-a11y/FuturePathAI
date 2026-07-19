import { Injectable, Inject } from '@nestjs/common';
import { NOTIFICATION_REPOSITORY } from './interfaces/notification.repository.interface';
import type { INotificationRepository } from './interfaces/notification.repository.interface';
import { NOTIFICATION_CHANNEL } from './interfaces/notification.channel.interface';
import type { INotificationChannel } from './interfaces/notification.channel.interface';
import { NotificationEntity } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepo: INotificationRepository,
    @Inject(NOTIFICATION_CHANNEL)
    private readonly notificationChannel: INotificationChannel,
  ) {}

  async getUserNotifications(userId: string) {
    return this.notificationRepo.findByUserId(userId);
  }

  async markAsRead(id: string) {
    return this.notificationRepo.markAsRead(id);
  }

  async notifyUser(
    userId: string,
    title: string,
    message: string,
    type: string = 'SYSTEM',
  ) {
    const notification = await this.notificationRepo.create({
      userId,
      title,
      message,
      type,
    });

    // Send via channel (e.g. Email, Push, or Mock)
    await this.notificationChannel.send(notification);

    return notification;
  }
}
