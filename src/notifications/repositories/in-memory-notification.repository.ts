import { Injectable } from '@nestjs/common';
import { INotificationRepository } from '../interfaces/notification.repository.interface';
import { NotificationEntity } from '../entities/notification.entity';
import { randomUUID } from 'crypto';

@Injectable()
export class InMemoryNotificationRepository implements INotificationRepository {
  private notifications: Map<string, NotificationEntity> = new Map();

  async findByUserId(userId: string): Promise<NotificationEntity[]> {
    const results: NotificationEntity[] = [];
    for (const notif of this.notifications.values()) {
      if (notif.userId === userId) {
        results.push(notif);
      }
    }
    return results.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  async create(
    notification: Partial<NotificationEntity>,
  ): Promise<NotificationEntity> {
    const newNotif: NotificationEntity = {
      id: randomUUID(),
      userId: notification.userId!,
      type: notification.type || 'SYSTEM',
      title: notification.title || '',
      message: notification.message || '',
      isRead: false,
      metadata: notification.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.notifications.set(newNotif.id, newNotif);
    return newNotif;
  }

  async markAsRead(id: string): Promise<boolean> {
    const notif = this.notifications.get(id);
    if (!notif) return false;
    notif.isRead = true;
    notif.updatedAt = new Date();
    return true;
  }
}
