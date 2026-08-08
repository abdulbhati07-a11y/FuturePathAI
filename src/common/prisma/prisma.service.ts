import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const connectionString = process.env.DATABASE_URL as string;

    const pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }, // Required for Supabase
    });

    const adapter = new PrismaPg(pool);

    super({ adapter } as any);
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
