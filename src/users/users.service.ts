import { Injectable, Inject } from '@nestjs/common';
import { USER_REPOSITORY } from './interfaces/user.repository.interface';
import type { IUserRepository } from './interfaces/user.repository.interface';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {}

  async findById(id: string): Promise<UserEntity | null> {
    return this.userRepository.findById(id);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepository.findByEmail(email);
  }

  async create(user: Partial<UserEntity>): Promise<UserEntity> {
    return this.userRepository.create(user);
  }

  async update(
    id: string,
    user: Partial<UserEntity>,
  ): Promise<UserEntity | null> {
    return this.userRepository.update(id, user);
  }
}
