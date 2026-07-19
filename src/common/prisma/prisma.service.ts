import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const url = process.env.DATABASE_URL as string;
    // @prisma/adapter-mariadb expects a mariadb:// URI scheme
    const mariadbUrl = url.replace('mysql://', 'mariadb://');
    const adapter = new PrismaMariaDb(mariadbUrl);

    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') return;
    await this.notification.deleteMany();
    await this.report.deleteMany();
    await this.simulation.deleteMany();
    await this.user.deleteMany();
  }
}
