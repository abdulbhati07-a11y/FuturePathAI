import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { REPORT_REPOSITORY } from './interfaces/report.repository.interface';
import { InMemoryReportRepository } from './repositories/in-memory-report.repository';
import { PrismaReportRepository } from './repositories/prisma-report.repository';
import { SimulationsModule } from '../simulations/simulations.module';

@Module({
  imports: [SimulationsModule], // Needed to check simulation status
  controllers: [ReportsController],
  providers: [
    ReportsService,
    {
      provide: REPORT_REPOSITORY,
      useClass: PrismaReportRepository,
    },
  ],
  exports: [ReportsService],
})
export class ReportsModule {}
