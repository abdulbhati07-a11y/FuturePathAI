import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UserEntity } from '../entities/user.entity';
import { IUserRepository } from '../interfaces/user.repository.interface';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? this.mapToEntity(user) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return user ? this.mapToEntity(user) : null;
  }

  async create(user: Partial<UserEntity>): Promise<UserEntity> {
    const created = await this.prisma.user.create({
      data: {
        id: user.id,
        email: user.email!,
        passwordHash: user.passwordHash!,
        name: user.name!,
        roles: (user.roles || [Role.USER]) as any,
        profile: user.profile ?? undefined,
      } as any,
    });
    return this.mapToEntity(created);
  }

  async update(
    id: string,
    user: Partial<UserEntity>,
  ): Promise<UserEntity | null> {
    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(user.email && { email: user.email }),
        ...(user.passwordHash && { passwordHash: user.passwordHash }),
        ...(user.name && { name: user.name }),
        ...(user.roles !== undefined && { roles: user.roles as any }),
        ...(user.profile !== undefined && { profile: user.profile }),
      },
    });
    return this.mapToEntity(updated);
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.user.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  private mapToEntity(user: any): UserEntity {
    return {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      name: user.name,
      roles: (user.roles ?? []) as Role[],
      profile: user.profile ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
