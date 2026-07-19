import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SimulationsService } from './simulations.service';
import { CreateSimulationDto, UpdateSimulationDto } from './dto/simulation.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Simulations')
@ApiBearerAuth()
@Controller('simulations')
export class SimulationsController {
  constructor(private readonly simulationsService: SimulationsService) {}

  private getUserId(user: any): string {
    return user?.id || user?.userId || 'seed-user-id';
  }

  @Post()
  @ApiOperation({ summary: 'Create a new simulation' })
  create(
    @CurrentUser() user: any,
    @Body() createSimulationDto: CreateSimulationDto,
  ) {
    return this.simulationsService.create(
      this.getUserId(user),
      createSimulationDto,
    );
  }

  @Get('public')
  @ApiOperation({ summary: 'Get all public simulations' })
  findPublic() {
    return this.simulationsService.findPublic();
  }

  @Get()
  @ApiOperation({ summary: 'Get all simulations for current user (paginated)' })
  findAll(@CurrentUser() user: any, @Query() query: any) {
    return this.simulationsService.findAll(this.getUserId(user), query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a simulation by id' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.simulationsService.findOne(this.getUserId(user), id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a simulation (e.g. answer questions)' })
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateSimulationDto: UpdateSimulationDto,
  ) {
    return this.simulationsService.update(
      this.getUserId(user),
      id,
      updateSimulationDto,
    );
  }

  @Patch(':id/public')
  @ApiOperation({ summary: 'Toggle public visibility of a simulation' })
  togglePublic(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('isPublic') isPublic: boolean,
  ) {
    return this.simulationsService.togglePublic(
      this.getUserId(user),
      id,
      isPublic,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a simulation' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.simulationsService.delete(this.getUserId(user), id);
  }

  @Get(':id/results')
  @ApiOperation({ summary: 'Get simulation results' })
  getResults(@CurrentUser() user: any, @Param('id') id: string) {
    return this.simulationsService.getResults(this.getUserId(user), id);
  }

  @Post(':id/analyze')
  @ApiOperation({ summary: 'Trigger AI & Decision Engine analysis' })
  analyze(@CurrentUser() user: any, @Param('id') id: string) {
    return this.simulationsService.analyze(this.getUserId(user), id);
  }
}
