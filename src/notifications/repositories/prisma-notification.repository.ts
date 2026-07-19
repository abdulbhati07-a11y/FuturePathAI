import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationEntity } from '../entities/notification.entity';
import {
  INotificationRepository,
  NOTIFICATION_REPOSITORY,
} from '../interfaces/notification.repository.interface';

@Injectable()
export class PrismaNotificationRepository implements INotificationRepository {
  constructor(private prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<NotificationEntity[]> {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return notifications.map((notification) => this.mapToEntity(notification));
  }

  async create(
    notification: Partial<NotificationEntity>,
  ): Promise<NotificationEntity> {
    const created = await this.prisma.notification.create({
      data: {
        userId: notification.userId!,
        type: notification.type!,
        title: notification.title!,
        message: notification.message!,
        isRead: notification.isRead || false,
        metadata: notification.metadata,
      },
    });

    return this.mapToEntity(created);
  }

  async markAsRead(id: string): Promise<boolean> {
    try {
      await this.prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });
      return true;
    } catch {
      return false;
    }
  }

  private mapToEntity(notification: any): NotificationEntity {
    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      isRead: notification.isRead,
      metadata: notification.metadata,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    };
  }
}
