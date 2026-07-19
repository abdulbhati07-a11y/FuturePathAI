import { Controller, Post, Get, Param } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  private getUserId(user: any): string {
    return user?.id || user?.userId || 'seed-user-id';
  }

  @Post('generate/:simulationId')
  @ApiOperation({ summary: 'Generate a report for a completed simulation' })
  generate(
    @CurrentUser() user: any,
    @Param('simulationId') simulationId: string,
  ) {
    return this.reportsService.generateReport(
      this.getUserId(user),
      simulationId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an existing report by ID' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.reportsService.getReport(this.getUserId(user), id);
  }
}
