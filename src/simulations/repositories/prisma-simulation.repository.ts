import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SimulationEntity } from '../entities/simulation.entity';
import { ISimulationRepository } from '../interfaces/simulation.repository.interface';
import { SimulationCategory, SimulationStatus } from '../dto/simulation.dto';

@Injectable()
export class PrismaSimulationRepository implements ISimulationRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<SimulationEntity | null> {
    const sim = await this.prisma.simulation.findUnique({ where: { id } });
    return sim ? this.mapToEntity(sim) : null;
  }

  async findAll(filters: {
    userId?: string;
    category?: SimulationCategory;
    status?: SimulationStatus;
    page: number;
    limit: number;
  }): Promise<{ data: SimulationEntity[]; total: number }> {
    const where: any = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.category) where.category = filters.category;
    if (filters.status) where.status = filters.status;

    const [data, total] = await Promise.all([
      this.prisma.simulation.findMany({
        where,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.simulation.count({ where }),
    ]);

    return { data: data.map((s) => this.mapToEntity(s)), total };
  }

  async create(
    simulation: Partial<SimulationEntity>,
  ): Promise<SimulationEntity> {
    const created = await this.prisma.simulation.create({
      data: {
        id: simulation.id,
        userId: simulation.userId!,
        title: simulation.title!,
        category: simulation.category as string,
        status: (simulation.status || SimulationStatus.DRAFT) as string,
        answers: (simulation.answers || {}) as any,
        generatedQuestions: (simulation.generatedQuestions || []) as any,
        decisionScore: simulation.decisionScore,
        riskScore: simulation.riskScore,
        confidenceScore: simulation.confidenceScore,
        isPublic: simulation.isPublic ?? false,
        ...(simulation.updatedAt && { updatedAt: simulation.updatedAt }),
      } as any,
    });
    return this.mapToEntity(created);
  }

  async update(
    id: string,
    simulation: Partial<SimulationEntity>,
  ): Promise<SimulationEntity | null> {
    const updated = await this.prisma.simulation.update({
      where: { id },
      data: {
        ...(simulation.title && { title: simulation.title }),
        ...(simulation.category && { category: simulation.category }),
        ...(simulation.status && { status: simulation.status }),
        ...(simulation.answers !== undefined && {
          answers: simulation.answers as any,
        }),
        ...(simulation.generatedQuestions !== undefined && {
          generatedQuestions: simulation.generatedQuestions as any,
        }),
        ...(simulation.decisionScore !== undefined && {
          decisionScore: simulation.decisionScore,
        }),
        ...(simulation.riskScore !== undefined && {
          riskScore: simulation.riskScore,
        }),
        ...(simulation.confidenceScore !== undefined && {
          confidenceScore: simulation.confidenceScore,
        }),
        ...(simulation.isPublic !== undefined && {
          isPublic: simulation.isPublic,
        }),
      },
    });
    return this.mapToEntity(updated);
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.simulation.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  private mapToEntity(sim: any): SimulationEntity {
    return {
      id: sim.id,
      userId: sim.userId,
      title: sim.title,
      category: sim.category as SimulationCategory,
      status: sim.status as SimulationStatus,
      answers: (sim.answers ?? {}) as Record<string, any>,
      generatedQuestions: (sim.generatedQuestions ?? []) as any[],
      decisionScore: sim.decisionScore,
      riskScore: sim.riskScore,
      confidenceScore: sim.confidenceScore,
      isPublic: sim.isPublic,
      createdAt: sim.createdAt,
      updatedAt: sim.updatedAt,
    };
  }
}
