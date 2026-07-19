import type { IUserRepository } from './interfaces/user.repository.interface';
import { UserEntity } from './entities/user.entity';
export declare class UsersService {
    private readonly userRepository;
    constructor(userRepository: IUserRepository);
    findById(id: string): Promise<UserEntity | null>;
    findByEmail(email: string): Promise<UserEntity | null>;
    create(user: Partial<UserEntity>): Promise<UserEntity>;
    update(id: string, user: Partial<UserEntity>): Promise<UserEntity | null>;
}
