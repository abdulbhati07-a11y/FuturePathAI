import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { GlobalResponseInterceptor } from './common/interceptors/response.interceptor';
import { winstonLogger } from './common/logger/logger.config';
import helmet from 'helmet';
import { UsersService } from './users/users.service';
import * as bcrypt from 'bcrypt';
import { Role } from './common/enums/role.enum';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: winstonLogger,
  });

  // Security
  app.use(helmet());
  app.enableCors();

  // Global Pipes & Filters
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new GlobalResponseInterceptor());

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('FuturePath AI API')
    .setDescription('Backend API for FuturePath AI decision engine')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Seed initial data
  const usersService = app.get(UsersService);
  const existingAdmin = await usersService.findByEmail('admin@futurepath.ai');
  if (!existingAdmin) {
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash('admin123', salt);
    await usersService.create({
      email: 'admin@futurepath.ai',
      passwordHash: hash,
      name: 'Admin User',
      roles: [Role.USER, Role.PREMIUM, Role.ADMIN],
    });
    const hash2 = await bcrypt.hash('user123', salt);
    await usersService.create({
      email: 'user@futurepath.ai',
      passwordHash: hash2,
      name: 'Standard User',
      roles: [Role.USER],
    });
    winstonLogger.log('Seeded initial mock users.');
  }

  // Start app
  const port = process.env.PORT || 3000;
  await app.listen(port);
  winstonLogger.log(`Application is running on: http://localhost:${port}`);
  winstonLogger.log(
    `Swagger docs available at: http://localhost:${port}/api/docs`,
  );
}
bootstrap();
