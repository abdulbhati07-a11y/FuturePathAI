import { Injectable } from '@nestjs/common';
import { IUserRepository } from '../interfaces/user.repository.interface';
import { UserEntity } from '../entities/user.entity';
import { randomUUID } from 'crypto';

@Injectable()
export class InMemoryUserRepository implements IUserRepository {
  private users: Map<string, UserEntity> = new Map();

  async findById(id: string): Promise<UserEntity | null> {
    return this.users.get(id) || null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async create(user: Partial<UserEntity>): Promise<UserEntity> {
    const newUser: UserEntity = {
      id: randomUUID(),
      email: user.email!,
      passwordHash: user.passwordHash!,
      name: user.name!,
      roles: user.roles || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(newUser.id, newUser);
    return newUser;
  }

  async update(
    id: string,
    userUpdate: Partial<UserEntity>,
  ): Promise<UserEntity | null> {
    const user = this.users.get(id);
    if (!user) return null;

    const updatedUser = { ...user, ...userUpdate, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async delete(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  // Helper for seeding
  async clearAndSeed(users: UserEntity[]) {
    this.users.clear();
    for (const u of users) {
      this.users.set(u.id, u);
    }
  }
}
