import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // Public: Render's health check probes GET / and needs a 2xx without a JWT.
  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
