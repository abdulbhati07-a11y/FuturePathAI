import { UserEntity } from '../entities/user.entity';
export declare const USER_REPOSITORY: unique symbol;
export interface IUserRepository {
    findById(id: string): Promise<UserEntity | null>;
    findByEmail(email: string): Promise<UserEntity | null>;
    create(user: Partial<UserEntity>): Promise<UserEntity>;
    update(id: string, user: Partial<UserEntity>): Promise<UserEntity | null>;
    delete(id: string): Promise<boolean>;
}
