import { Module, Global } from '@nestjs/common';
import { ProbabilityService } from './probability.service';

@Global()
@Module({
  providers: [ProbabilityService],
  exports: [ProbabilityService],
})
export class ProbabilityModule {}
