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

    // Cloud MySQL providers (TiDB Cloud, Aiven, PlanetScale, etc.) require TLS.
    // When DATABASE_SSL=true we pass a PoolConfig object with ssl enabled
    // instead of a bare connection string. rejectUnauthorized stays true so we
    // actually verify the server cert; set DATABASE_SSL_INSECURE=true only if a
    // provider uses a self-signed cert and you accept the risk.
    const useSsl = process.env.DATABASE_SSL === 'true';
    const adapter = useSsl
      ? new PrismaMariaDb({
          ...parseMysqlUrl(mariadbUrl),
          ssl: {
            rejectUnauthorized:
              process.env.DATABASE_SSL_INSECURE !== 'true',
          },
        })
      : new PrismaMariaDb(mariadbUrl);

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

/** Break a mariadb:// connection string into the fields the pool config needs. */
function parseMysqlUrl(connectionUrl: string): {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
} {
  const u = new URL(connectionUrl);
  return {
    host: u.hostname,
    port: u.port ? parseInt(u.port, 10) : 3306,
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, ''),
  };
}
