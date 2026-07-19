import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { REPORT_REPOSITORY } from './interfaces/report.repository.interface';
import type { IReportRepository } from './interfaces/report.repository.interface';
import { SimulationsService } from '../simulations/simulations.service';
import { AI_PROVIDER } from '../ai/interfaces/ai.provider.interface';
import type { IAIProvider } from '../ai/interfaces/ai.provider.interface';
import { DecisionEngineService } from '../decision-engine/decision-engine.service';
import { ReportEntity } from './entities/report.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class ReportsService {
  constructor(
    @Inject(REPORT_REPOSITORY) private readonly reportRepo: IReportRepository,
    private readonly simulationsService: SimulationsService,
    @Inject(AI_PROVIDER) private readonly aiProvider: IAIProvider,
    private readonly decisionEngine: DecisionEngineService,
    private readonly usersService: UsersService,
  ) {}

  async generateReport(
    userId: string,
    simulationId: string,
  ): Promise<ReportEntity> {
    // 1. Verify simulation exists and belongs to user
    const simulation = await this.simulationsService.findOne(
      userId,
      simulationId,
    );

    if (simulation.status !== 'COMPLETED') {
      throw new ForbiddenException(
        'Simulation must be COMPLETED before generating a report. Call /analyze first.',
      );
    }

    // 2. Check if report already exists
    const existing = await this.reportRepo.findBySimulationId(simulationId);
    if (existing) {
      return existing;
    }

    const user = await this.usersService.findById(userId);
    const contextProfile = (user as any)?.profile;

    // 3. Generate dynamic report data via AI and Decision Engine
    const fullReport = await this.aiProvider.generateFullReport(
      simulation.title,
      simulation.category,
      simulation.answers,
      contextProfile,
    );

    // We will save this full AI-generated report object in the `recommendations` JSON field
    // to avoid a Prisma schema migration, while ensuring we have all the data.

    // We also generate summary for the report list view using the AI's title/desc
    const summary = fullReport.mostLikely?.description || 'AI Generated Report';

    const financialProjections =
      this.decisionEngine.generateFinancialProjections(simulation.answers);

    // 4. Create report
    return this.reportRepo.create({
      simulationId,
      userId,
      summary,
      chartData: [
        {
          chartType: 'line',
          title: 'Financial Projections',
          labels: financialProjections.labels,
          series: financialProjections.series,
        },
      ],
      timeline:
        fullReport.timeline ||
        this.decisionEngine.generateTimeline(simulation.answers),
      scores: {
        decision: simulation.decisionScore || 0,
        risk: simulation.riskScore || 0,
        confidence: simulation.confidenceScore || 0,
      },
      recommendations: fullReport,
    });
  }

  async getReport(userId: string, reportId: string): Promise<ReportEntity> {
    const report = await this.reportRepo.findById(reportId);
    if (!report) {
      throw new NotFoundException('Report not found');
    }
    if (report.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return report;
  }
}
