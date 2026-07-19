import { Injectable, Logger } from '@nestjs/common';
import { INotificationChannel } from '../interfaces/notification.channel.interface';
import { NotificationEntity } from '../entities/notification.entity';

@Injectable()
export class MockNotificationChannel implements INotificationChannel {
  private readonly logger = new Logger(MockNotificationChannel.name);

  async send(notification: NotificationEntity): Promise<boolean> {
    this.logger.log(
      `[Mock Channel] Sending notification to user ${notification.userId}: ${notification.title}`,
    );
    return true;
  }
}
