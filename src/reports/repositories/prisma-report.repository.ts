import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ReportEntity } from '../entities/report.entity';
import { IReportRepository } from '../interfaces/report.repository.interface';

@Injectable()
export class PrismaReportRepository implements IReportRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<ReportEntity | null> {
    const report = await this.prisma.report.findUnique({ where: { id } });
    return report ? this.mapToEntity(report) : null;
  }

  async findBySimulationId(simulationId: string): Promise<ReportEntity | null> {
    const report = await this.prisma.report.findUnique({
      where: { simulationId },
    });
    return report ? this.mapToEntity(report) : null;
  }

  async create(report: Partial<ReportEntity>): Promise<ReportEntity> {
    const created = await this.prisma.report.create({
      data: {
        simulationId: report.simulationId!,
        userId: report.userId!,
        summary: report.summary || '',
        chartData: (report.chartData || []) as any,
        timeline: (report.timeline || []) as any,
        scores: (report.scores || {
          decision: 0,
          risk: 0,
          confidence: 0,
        }) as any,
        recommendations: (report.recommendations || []) as any,
      },
    });
    return this.mapToEntity(created);
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.report.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  private mapToEntity(report: any): ReportEntity {
    return {
      id: report.id,
      simulationId: report.simulationId,
      userId: report.userId,
      summary: report.summary,
      chartData: report.chartData,
      timeline: report.timeline,
      scores: report.scores,
      recommendations: report.recommendations,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    };
  }
}
