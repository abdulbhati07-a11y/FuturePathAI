import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SimulationCategory {
  CAREER = 'CAREER',
  FINANCIAL = 'FINANCIAL',
  PERSONAL = 'PERSONAL',
  BUSINESS = 'BUSINESS',
  HEALTH = 'HEALTH',
  EDUCATION = 'EDUCATION',
}

export enum SimulationStatus {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

export class CreateSimulationDto {
  @ApiProperty({ example: 'My Career Move' })
  @IsString()
  title: string;

  @ApiProperty({ enum: SimulationCategory })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsEnum(SimulationCategory)
  category: SimulationCategory;
}

export class UpdateSimulationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ enum: SimulationCategory })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsEnum(SimulationCategory)
  category?: SimulationCategory;

  @ApiPropertyOptional({ enum: SimulationStatus })
  @IsOptional()
  @IsEnum(SimulationStatus)
  status?: SimulationStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  answers?: Record<string, any>;
}
