import { IReportRepository } from '../interfaces/report.repository.interface';
import { ReportEntity } from '../entities/report.entity';
export declare class InMemoryReportRepository implements IReportRepository {
    private reports;
    findById(id: string): Promise<ReportEntity | null>;
    findBySimulationId(simulationId: string): Promise<ReportEntity | null>;
    create(report: Partial<ReportEntity>): Promise<ReportEntity>;
    delete(id: string): Promise<boolean>;
}
