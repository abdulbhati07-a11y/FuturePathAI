import { Module, Global } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { USER_REPOSITORY } from './interfaces/user.repository.interface';
import { InMemoryUserRepository } from './repositories/in-memory-user.repository';
import { PrismaUserRepository } from './repositories/prisma-user.repository';

@Global()
@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
  ],
  exports: [UsersService, USER_REPOSITORY],
})
export class UsersModule {}
