import { UsersService } from '../users/users.service';
export declare class AdminService {
    private readonly usersService;
    constructor(usersService: UsersService);
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
