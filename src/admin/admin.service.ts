import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class AdminService {
  constructor(private readonly usersService: UsersService) {}

  async getAnalytics() {
    return {
      totalUsers: 1500,
      activeSimulations: 350,
      aiUsageTokens: 1250000,
      monthlyRevenue: 45000,
      growthRate: 15.4,
    };
  }

  async getRecentUsers() {
    return [
      { id: '1', email: 'user1@example.com', createdAt: new Date() },
      { id: '2', email: 'user2@example.com', createdAt: new Date() },
    ];
  }
}
