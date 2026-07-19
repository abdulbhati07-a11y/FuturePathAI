import { AdminService } from './admin.service';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getAnalytics(): Promise<{
        totalUsers: number;
        activeSimulations: number;
        aiUsageTokens: number;
        monthlyRevenue: number;
        growthRate: number;
    }>;
    getRecentUsers(): Promise<{
        id: string;
        email: string;
        createdAt: Date;
    }[]>;
}
