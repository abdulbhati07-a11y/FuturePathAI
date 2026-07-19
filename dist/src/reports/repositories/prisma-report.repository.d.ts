import { PrismaService } from '../../common/prisma/prisma.service';
import { ReportEntity } from '../entities/report.entity';
import { IReportRepository } from '../interfaces/report.repository.interface';
export declare class PrismaReportRepository implements IReportRepository {
    private prisma;
    constructor(prisma: PrismaService);
    findById(id: string): Promise<ReportEntity | null>;
    findBySimulationId(simulationId: string): Promise<ReportEntity | null>;
    create(report: Partial<ReportEntity>): Promise<ReportEntity>;
    delete(id: string): Promise<boolean>;
    private mapToEntity;
}
