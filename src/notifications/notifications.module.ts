import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NOTIFICATION_REPOSITORY } from './interfaces/notification.repository.interface';
import { InMemoryNotificationRepository } from './repositories/in-memory-notification.repository';
import { PrismaNotificationRepository } from './repositories/prisma-notification.repository';
import { NOTIFICATION_CHANNEL } from './interfaces/notification.channel.interface';
import { MockNotificationChannel } from './channels/mock.channel';

@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    {
      provide: NOTIFICATION_REPOSITORY,
      useClass: PrismaNotificationRepository,
    },
    {
      provide: NOTIFICATION_CHANNEL,
      useClass: MockNotificationChannel,
    },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
