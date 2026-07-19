import type { IReportRepository } from './interfaces/report.repository.interface';
import { SimulationsService } from '../simulations/simulations.service';
import type { IAIProvider } from '../ai/interfaces/ai.provider.interface';
import { DecisionEngineService } from '../decision-engine/decision-engine.service';
import { ReportEntity } from './entities/report.entity';
import { UsersService } from '../users/users.service';
export declare class ReportsService {
    private readonly reportRepo;
    private readonly simulationsService;
    private readonly aiProvider;
    private readonly decisionEngine;
    private readonly usersService;
    constructor(reportRepo: IReportRepository, simulationsService: SimulationsService, aiProvider: IAIProvider, decisionEngine: DecisionEngineService, usersService: UsersService);
    generateReport(userId: string, simulationId: string): Promise<ReportEntity>;
    getReport(userId: string, reportId: string): Promise<ReportEntity>;
}
