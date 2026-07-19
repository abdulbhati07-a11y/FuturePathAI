import { ReportEntity } from '../entities/report.entity';

export const REPORT_REPOSITORY = Symbol('REPORT_REPOSITORY');

export interface IReportRepository {
  findById(id: string): Promise<ReportEntity | null>;
  findBySimulationId(simulationId: string): Promise<ReportEntity | null>;
  create(report: Partial<ReportEntity>): Promise<ReportEntity>;
  delete(id: string): Promise<boolean>;
}
