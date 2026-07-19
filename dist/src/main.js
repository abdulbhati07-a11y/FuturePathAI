"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const response_interceptor_1 = require("./common/interceptors/response.interceptor");
const logger_config_1 = require("./common/logger/logger.config");
const helmet_1 = __importDefault(require("helmet"));
const users_service_1 = require("./users/users.service");
const bcrypt = __importStar(require("bcrypt"));
const role_enum_1 = require("./common/enums/role.enum");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: logger_config_1.winstonLogger,
    });
    app.use((0, helmet_1.default)());
    app.enableCors();
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.useGlobalFilters(new http_exception_filter_1.GlobalExceptionFilter());
    app.useGlobalInterceptors(new response_interceptor_1.GlobalResponseInterceptor());
    const config = new swagger_1.DocumentBuilder()
        .setTitle('FuturePath AI API')
        .setDescription('Backend API for FuturePath AI decision engine')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    const usersService = app.get(users_service_1.UsersService);
    const existingAdmin = await usersService.findByEmail('admin@futurepath.ai');
    if (!existingAdmin) {
        const salt = await bcrypt.genSalt();
        const hash = await bcrypt.hash('admin123', salt);
        await usersService.create({
            email: 'admin@futurepath.ai',
            passwordHash: hash,
            name: 'Admin User',
            roles: [role_enum_1.Role.USER, role_enum_1.Role.PREMIUM, role_enum_1.Role.ADMIN],
        });
        const hash2 = await bcrypt.hash('user123', salt);
        await usersService.create({
            email: 'user@futurepath.ai',
            passwordHash: hash2,
            name: 'Standard User',
            roles: [role_enum_1.Role.USER],
        });
        logger_config_1.winstonLogger.log('Seeded initial mock users.');
    }
    const port = process.env.PORT || 3000;
    await app.listen(port);
    logger_config_1.winstonLogger.log(`Application is running on: http://localhost:${port}`);
    logger_config_1.winstonLogger.log(`Swagger docs available at: http://localhost:${port}/api/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map