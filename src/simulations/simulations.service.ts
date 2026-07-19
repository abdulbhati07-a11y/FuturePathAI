import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  OnModuleInit,
} from '@nestjs/common';
import { SIMULATION_REPOSITORY } from './interfaces/simulation.repository.interface';
import type { ISimulationRepository } from './interfaces/simulation.repository.interface';
import {
  CreateSimulationDto,
  UpdateSimulationDto,
  SimulationStatus,
} from './dto/simulation.dto';
import { AI_PROVIDER } from '../ai/interfaces/ai.provider.interface';
import type { IAIProvider } from '../ai/interfaces/ai.provider.interface';
import { DecisionEngineService } from '../decision-engine/decision-engine.service';
import { SimulationEntity } from './entities/simulation.entity';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class SimulationsService {
  constructor(
    @Inject(SIMULATION_REPOSITORY)
    private readonly simulationRepo: ISimulationRepository,
    @Inject(AI_PROVIDER) private readonly aiProvider: IAIProvider,
    private readonly decisionEngine: DecisionEngineService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    // Seed initial mock simulations for dashboard
    const { total } = await this.simulationRepo.findAll({ page: 1, limit: 1 });
    if (total === 0) {
      const seedUserId = 'seed-user-id';

      // Ensure the seed user exists to satisfy foreign key constraints
      await this.prisma.user.upsert({
        where: { id: seedUserId },
        update: {},
        create: {
          id: seedUserId,
          email: 'seed@futurepath.ai',
          passwordHash: 'seed-password-hash',
          name: 'Demo User',
        },
      });

      await this.simulationRepo.create({
        id: 'sim_1',
        userId: seedUserId,
        title: 'Series C Equity Liquidate',
        category: 'FINANCIAL' as any,
        status: SimulationStatus.COMPLETED,
        riskScore: 14,
        confidenceScore: 98.2,
        decisionScore: 95, // A+ equivalent
        updatedAt: new Date('2024-10-12'),
      });
      await this.simulationRepo.create({
        id: 'sim_2',
        userId: seedUserId,
        title: 'Primary Residence Pivot',
        category: 'PERSONAL' as any,
        status: SimulationStatus.IN_PROGRESS,
        riskScore: 42,
        confidenceScore: 76.4,
        decisionScore: 82, // B- equivalent
        updatedAt: new Date('2024-10-09'),
      });
    }
  }

  async create(userId: string, createDto: CreateSimulationDto) {
    const generatedQuestions = await this.aiProvider.generateQuestions(
      createDto.category,
    );

    return this.simulationRepo.create({
      userId,
      title: createDto.title,
      category: createDto.category,
      status: SimulationStatus.DRAFT,
      answers: {},
      generatedQuestions,
    });
  }

  async findAll(userId: string, query: any) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;

    // Note: If user is not admin, we could enforce filtering only their simulations
    // For now, we enforce userId filter for all standard users at the controller level

    const result = await this.simulationRepo.findAll({
      userId, // Always restrict to the requesting user
      category: query.category,
      status: query.status,
      page,
      limit,
    });

    // Format for the interceptor
    return {
      data: result.data.map((sim) => this.mapToFrontendDto(sim)),
      meta: {
        total: result.total,
        page,
        limit,
      },
    };
  }

  private mapToFrontendDto(sim: SimulationEntity) {
    // Map backend enums/nulls to frontend expectations
    return {
      id: sim.id,
      title: sim.title,
      category: sim.category,
      status: sim.status,
      riskLevel: sim.riskScore
        ? sim.riskScore < 30
          ? 'Low'
          : sim.riskScore < 70
            ? 'Med'
            : 'High'
        : 'Unknown',
      riskPercent: sim.riskScore || 0,
      confidenceScore: sim.confidenceScore || 0,
      decisionGrade: sim.decisionScore
        ? sim.decisionScore > 90
          ? 'A+'
          : sim.decisionScore > 80
            ? 'A'
            : 'B'
        : 'N/A',
      statusTag:
        sim.status === SimulationStatus.COMPLETED
          ? 'SAFE PATH'
          : 'PENDING ACTION',
      updatedAt: sim.updatedAt,
      // Include null scores as requested
      decisionScore: sim.decisionScore,
      riskScore: sim.riskScore,
      isPublic: sim.isPublic,
    };
  }

  async findPublic() {
    const publicSims = await this.prisma.simulation.findMany({
      where: { isPublic: true },
      include: {
        user: { select: { name: true, profile: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return publicSims.map((sim) => ({
      ...this.mapToFrontendDto(sim as any),
      authorName: (sim as any).user?.name || 'Anonymous',
      authorProfile: (sim as any).user?.profile || null,
    }));
  }

  async findOne(userId: string, id: string) {
    const simulation = await this.simulationRepo.findById(id);
    if (!simulation) {
      throw new NotFoundException('Simulation not found');
    }
    if (simulation.userId !== userId) {
      throw new ForbiddenException('You do not have access to this simulation');
    }
    return simulation;
  }

  async update(userId: string, id: string, updateDto: UpdateSimulationDto) {
    const simulation = await this.findOne(userId, id); // validates ownership

    const updates: Partial<SimulationEntity> = { ...updateDto };

    // Lifecycle logic: If answers are edited, reset scores and change status to IN_PROGRESS
    if (updateDto.answers) {
      updates.status = SimulationStatus.IN_PROGRESS;
      updates.decisionScore = null;
      updates.riskScore = null;
      updates.confidenceScore = null;
    }

    return this.simulationRepo.update(id, updates);
  }

  async togglePublic(userId: string, id: string, isPublic: boolean) {
    const simulation = await this.findOne(userId, id); // validates ownership
    return this.simulationRepo.update(id, { isPublic });
  }

  async delete(userId: string, id: string) {
    await this.findOne(userId, id); // validates ownership
    return this.simulationRepo.delete(id);
  }

  async analyze(userId: string, id: string) {
    const simulation = await this.findOne(userId, id); // validates ownership

    // Trigger Decision Engine & AI Analysis
    const scores = this.decisionEngine.calculateScores(simulation.answers);

    // Update simulation
    return this.simulationRepo.update(id, {
      decisionScore: scores.decisionScore,
      riskScore: scores.riskScore,
      confidenceScore: scores.confidenceScore,
      status: SimulationStatus.COMPLETED,
    });
  }

  async getResults(userId: string, id: string) {
    const simulation = await this.findOne(userId, id);
    const report = await this.prisma.report.findUnique({
      where: { simulationId: id },
    });

    if (!report) {
      throw new NotFoundException(
        'Report not generated yet for this simulation',
      );
    }

    const aiData: any = report.recommendations || {};

    return {
      id: simulation.id,
      title: simulation.title,
      isPublic: simulation.isPublic,
      finalizedDate: report.updatedAt.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      overallRisk: simulation.riskScore
        ? simulation.riskScore < 30
          ? 'Low'
          : simulation.riskScore < 70
            ? 'Moderate'
            : 'High'
        : 'Moderate',
      riskLabel: 'Determined by AI',
      confidence: simulation.confidenceScore || 94,
      bestCase: aiData.bestCase,
      mostLikely: aiData.mostLikely,
      worstCase: aiData.worstCase,
      rightReasons: aiData.rightReasons || [],
      wrongReasons: aiData.wrongReasons || [],
      timeline: report.timeline || aiData.timeline || [],
      alternatives: aiData.alternatives || [],
    };
  }
}
