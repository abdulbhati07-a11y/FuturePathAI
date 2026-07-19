import { Module, Global } from '@nestjs/common';
import { AI_PROVIDER } from './interfaces/ai.provider.interface';
import { GroqAiProvider } from './providers/groq-ai.provider';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Global()
@Module({
  controllers: [AiController],
  providers: [
    AiService,
    {
      provide: AI_PROVIDER,
      useClass: GroqAiProvider,
    },
  ],
  exports: [AI_PROVIDER, AiService],
})
export class AiModule {}
