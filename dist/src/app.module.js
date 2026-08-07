"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_module_1 = require("./common/prisma/prisma.module");
const users_module_1 = require("./users/users.module");
const auth_module_1 = require("./auth/auth.module");
const ai_module_1 = require("./ai/ai.module");
const decision_engine_module_1 = require("./decision-engine/decision-engine.module");
const probability_module_1 = require("./probability/probability.module");
const simulations_module_1 = require("./simulations/simulations.module");
const reports_module_1 = require("./reports/reports.module");
const notifications_module_1 = require("./notifications/notifications.module");
const admin_module_1 = require("./admin/admin.module");
const analytics_module_1 = require("./analytics/analytics.module");
const bullmq_1 = require("@nestjs/bullmq");
const cache_manager_1 = require("@nestjs/cache-manager");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            throttler_1.ThrottlerModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => [
                    {
                        name: 'default',
                        ttl: 60_000,
                        limit: 120,
                    },
                    {
                        name: 'ai-chat',
                        ttl: 60_000,
                        limit: 10,
                    },
                    {
                        name: 'ai-topic',
                        ttl: 60_000,
                        limit: 20,
                    },
                ],
                inject: [config_1.ConfigService],
            }),
            prisma_module_1.PrismaModule,
            bullmq_1.BullModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: async (configService) => {
                    const isEnabled = configService.get('ENABLE_BULLMQ') === 'true';
                    if (!isEnabled) {
                        return {};
                    }
                    return {
                        connection: {
                            host: configService.get('REDIS_HOST'),
                            port: parseInt(configService.get('REDIS_PORT') || '6379', 10),
                        },
                    };
                },
                inject: [config_1.ConfigService],
            }),
            cache_manager_1.CacheModule.registerAsync({
                imports: [config_1.ConfigModule],
                isGlobal: true,
                useFactory: async (configService) => {
                    const isEnabled = configService.get('ENABLE_REDIS') === 'true';
                    if (isEnabled) {
                        return {};
                    }
                    return {};
                },
                inject: [config_1.ConfigService],
            }),
            users_module_1.UsersModule,
            auth_module_1.AuthModule,
            ai_module_1.AiModule,
            decision_engine_module_1.DecisionEngineModule,
            probability_module_1.ProbabilityModule,
            simulations_module_1.SimulationsModule,
            reports_module_1.ReportsModule,
            notifications_module_1.NotificationsModule,
            admin_module_1.AdminModule,
            analytics_module_1.AnalyticsModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService, { provide: core_1.APP_GUARD, useClass: throttler_1.ThrottlerGuard }],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map