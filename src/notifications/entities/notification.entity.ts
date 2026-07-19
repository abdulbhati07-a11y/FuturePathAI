import { BaseEntity } from '../../common/entities/base.entity';

export class NotificationEntity extends BaseEntity {
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: any;
}
