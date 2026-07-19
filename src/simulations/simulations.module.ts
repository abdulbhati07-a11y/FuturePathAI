import { Module } from '@nestjs/common';
import { SimulationsService } from './simulations.service';
import { SimulationsController } from './simulations.controller';
import { SIMULATION_REPOSITORY } from './interfaces/simulation.repository.interface';
import { InMemorySimulationRepository } from './repositories/in-memory-simulation.repository';
import { PrismaSimulationRepository } from './repositories/prisma-simulation.repository';
import { AiModule } from '../ai/ai.module';
import { DecisionEngineModule } from '../decision-engine/decision-engine.module';

@Module({
  imports: [AiModule, DecisionEngineModule],
  controllers: [SimulationsController],
  providers: [
    SimulationsService,
    {
      provide: SIMULATION_REPOSITORY,
      useClass: PrismaSimulationRepository,
    },
  ],
  exports: [SimulationsService],
})
export class SimulationsModule {}
