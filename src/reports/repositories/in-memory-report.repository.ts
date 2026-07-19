import { Injectable } from '@nestjs/common';
import { IReportRepository } from '../interfaces/report.repository.interface';
import { ReportEntity } from '../entities/report.entity';
import { randomUUID } from 'crypto';

@Injectable()
export class InMemoryReportRepository implements IReportRepository {
  private reports: Map<string, ReportEntity> = new Map();

  async findById(id: string): Promise<ReportEntity | null> {
    return this.reports.get(id) || null;
  }

  async findBySimulationId(simulationId: string): Promise<ReportEntity | null> {
    for (const report of this.reports.values()) {
      if (report.simulationId === simulationId) {
        return report;
      }
    }
    return null;
  }

  async create(report: Partial<ReportEntity>): Promise<ReportEntity> {
    const newReport: ReportEntity = {
      id: randomUUID(),
      simulationId: report.simulationId!,
      userId: report.userId!,
      summary: report.summary || '',
      chartData: report.chartData || [],
      timeline: report.timeline || [],
      scores: report.scores || { decision: 0, risk: 0, confidence: 0 },
      recommendations: report.recommendations || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.reports.set(newReport.id, newReport);
    return newReport;
  }

  async delete(id: string): Promise<boolean> {
    return this.reports.delete(id);
  }
}
