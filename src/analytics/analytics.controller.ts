import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard-stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  getDashboardStats() {
    return this.analyticsService.getDashboardStats();
  }

  @Get('market-correlation')
  @ApiOperation({ summary: 'Get market correlation metrics' })
  getMarketCorrelation() {
    return this.analyticsService.getMarketCorrelation();
  }

  @Get('system-meta')
  @ApiOperation({ summary: 'Get system meta information' })
  getSystemMeta() {
    return this.analyticsService.getSystemMeta();
  }
}
