import { Controller, Get, Post, Param, Body, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AiService } from './ai.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { Response } from 'express';

// ─── DTOs with class-validator so ValidationPipe passes them ─────────────────

class ChatMessageDto {
  @IsString()
  role: 'user' | 'assistant';

  @IsString()
  content: string;
}

class ChatRequestDto {
  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages?: ChatMessageDto[];
}

@ApiTags('AI')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('advisor-insight')
  @ApiOperation({ summary: 'Get current AI advisor insight' })
  getAdvisorInsight() {
    return this.aiService.getAdvisorInsight();
  }

  @Post('generate-topic')
  @ApiOperation({ summary: 'Generate a simulation topic from a chat message' })
  generateTopic(@Body('message') message: string) {
    return this.aiService.generateTopicAndCategory(message || '');
  }

  /**
   * SSE streaming chat endpoint.
   *
   * Uses @Res() to write directly to the HTTP response so we can bypass
   * the GlobalResponseInterceptor which would wrap SSE events in JSON.
   *
   * SSE event types emitted:
   *   { type: 'token',       value: '<text chunk>' }
   *   { type: 'suggestions', value: ['…'] }
   *   { type: 'insight',     value: {…} }
   *   { type: 'done',        value: '' }
   *   { type: 'error',       value: '<message>' }
   */
  @Post('simulations/:id/chat')
  @ApiOperation({ summary: 'Stream AI chat for a simulation (SSE)' })
  @ApiBody({ type: ChatRequestDto })
  chatStream(
    @Param('id') simulationId: string,
    @Body() body: ChatRequestDto,
    @CurrentUser() user: any,
    @Res() res: Response,
  ): void {
    const userId = user?.id || user?.userId;

    const payload: string | ChatMessageDto[] =
      body.messages && body.messages.length > 0
        ? body.messages
        : (body.message ?? '');

    // Write SSE headers — this bypasses GlobalResponseInterceptor
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const send = (type: string, value: unknown) => {
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ type, value })}\n\n`);
        if (typeof (res as any).flush === 'function') (res as any).flush();
      }
    };

    (async () => {
      try {
        const stream = this.aiService.generateChatStream(
          simulationId,
          payload,
          userId,
        );

        let fullResponse = '';
        for await (const event of stream) {
          if (event.data.type === 'token') {
            fullResponse += event.data.value;
          }
          send(event.data.type, event.data.value);
        }

        // Generate dynamic suggestions based on the AI's full response
        let dynamicSuggestions = [
          'Tell me more about the risks',
          'What is the best-case scenario?',
          'How does this compare to alternatives?',
          'What should I do next?',
        ];
        try {
          if (fullResponse) {
            const replies =
              await this.aiService.generateQuickReplies(fullResponse);
            if (replies && replies.length > 0) {
              dynamicSuggestions = replies;
            }
          }
        } catch (err) {
          console.error('Failed to generate dynamic suggestions:', err);
        }

        // Post-stream: send suggestions + insight panel update
        if (!res.writableEnded) {
          send('suggestions', dynamicSuggestions);
          send('insight', {
            label: 'LIVE PATH INSIGHT',
            message:
              'Your responses are shaping the probability model. Keep answering to improve accuracy.',
          });
          send('done', '');
        }
      } catch (err) {
        send('error', (err as Error).message || 'Stream failed');
      } finally {
        if (!res.writableEnded) res.end();
      }
    })();
  }
}
