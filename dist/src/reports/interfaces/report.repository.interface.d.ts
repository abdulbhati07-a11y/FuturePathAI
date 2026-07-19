import { ReportEntity } from '../entities/report.entity';
export declare const REPORT_REPOSITORY: unique symbol;
export interface IReportRepository {
    findById(id: string): Promise<ReportEntity | null>;
    findBySimulationId(simulationId: string): Promise<ReportEntity | null>;
    create(report: Partial<ReportEntity>): Promise<ReportEntity>;
    delete(id: string): Promise<boolean>;
}
