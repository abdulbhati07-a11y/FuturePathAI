import { ReportsService } from './reports.service';
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    private getUserId;
    generate(user: any, simulationId: string): Promise<import("./entities/report.entity").ReportEntity>;
    findOne(user: any, id: string): Promise<import("./entities/report.entity").ReportEntity>;
}
