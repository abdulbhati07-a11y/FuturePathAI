import { Module, Global } from '@nestjs/common';
import { DecisionEngineService } from './decision-engine.service';

@Global()
@Module({
  providers: [DecisionEngineService],
  exports: [DecisionEngineService],
})
export class DecisionEngineModule {}
