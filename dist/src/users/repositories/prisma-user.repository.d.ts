import { PrismaService } from '../../common/prisma/prisma.service';
import { UserEntity } from '../entities/user.entity';
import { IUserRepository } from '../interfaces/user.repository.interface';
export declare class PrismaUserRepository implements IUserRepository {
    private prisma;
    constructor(prisma: PrismaService);
    findById(id: string): Promise<UserEntity | null>;
    findByEmail(email: string): Promise<UserEntity | null>;
    create(user: Partial<UserEntity>): Promise<UserEntity>;
    update(id: string, user: Partial<UserEntity>): Promise<UserEntity | null>;
    delete(id: string): Promise<boolean>;
    private mapToEntity;
}
