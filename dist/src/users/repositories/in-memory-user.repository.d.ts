import { IUserRepository } from '../interfaces/user.repository.interface';
import { UserEntity } from '../entities/user.entity';
export declare class InMemoryUserRepository implements IUserRepository {
    private users;
    findById(id: string): Promise<UserEntity | null>;
    findByEmail(email: string): Promise<UserEntity | null>;
    create(user: Partial<UserEntity>): Promise<UserEntity>;
    update(id: string, userUpdate: Partial<UserEntity>): Promise<UserEntity | null>;
    delete(id: string): Promise<boolean>;
    clearAndSeed(users: UserEntity[]): Promise<void>;
}
