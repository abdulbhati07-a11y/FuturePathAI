import { Module, Global } from '@nestjs/common';
import { AI_PROVIDER } from './interfaces/ai.provider.interface';
import { OpenCodeZenAiProvider } from './providers/opencodezen-ai.provider';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Global()
@Module({
  controllers: [AiController],
  providers: [
    AiService,
    {
      provide: AI_PROVIDER,
      useClass: OpenCodeZenAiProvider,
    },
  ],
  exports: [AI_PROVIDER, AiService],
})
export class AiModule {}
