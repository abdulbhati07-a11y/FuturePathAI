import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationEntity } from '../entities/notification.entity';
import { INotificationRepository } from '../interfaces/notification.repository.interface';
export declare class PrismaNotificationRepository implements INotificationRepository {
    private prisma;
    constructor(prisma: PrismaService);
    findByUserId(userId: string): Promise<NotificationEntity[]>;
    create(notification: Partial<NotificationEntity>): Promise<NotificationEntity>;
    markAsRead(id: string): Promise<boolean>;
    private mapToEntity;
}
