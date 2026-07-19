import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './common/prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AiModule } from './ai/ai.module';
import { DecisionEngineModule } from './decision-engine/decision-engine.module';
import { ProbabilityModule } from './probability/probability.module';
import { SimulationsModule } from './simulations/simulations.module';
import { ReportsModule } from './reports/reports.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdminModule } from './admin/admin.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { BullModule } from '@nestjs/bullmq';
import { CacheModule } from '@nestjs/cache-manager';
// import { keyvRedis } from 'cache-manager-redis-yet'; // Kept for reference if enabling redis cache

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    PrismaModule,

    // Conditionally load BullMQ based on flag
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const isEnabled = configService.get('ENABLE_BULLMQ') === 'true';
        if (!isEnabled) {
          // Return dummy config that won't try to connect
          return {} as any;
        }
        return {
          connection: {
            host: configService.get('REDIS_HOST'),
            port: parseInt(configService.get('REDIS_PORT') || '6379', 10),
          },
        };
      },
      inject: [ConfigService],
    }),

    // Cache Module (Redis vs Memory)
    CacheModule.registerAsync({
      imports: [ConfigModule],
      isGlobal: true,
      useFactory: async (configService: ConfigService) => {
        const isEnabled = configService.get('ENABLE_REDIS') === 'true';
        if (isEnabled) {
          // Return redis config (placeholder for now)
          return {
            // store: keyvRedis(configService.get('REDIS_HOST') + ':' + configService.get('REDIS_PORT')),
          };
        }
        // In-memory cache fallback
        return {};
      },
      inject: [ConfigService],
    }),

    UsersModule,
    AuthModule,
    AiModule,
    DecisionEngineModule,
    ProbabilityModule,
    SimulationsModule,
    ReportsModule,
    NotificationsModule,
    AdminModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
