import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryAssetTransactionsDto {
  @ApiPropertyOptional({ enum: ['1m', '3m', '6m', '1y', 'all'], default: '1y' })
  @IsOptional()
  @IsEnum(['1m', '3m', '6m', '1y', 'all'])
  period?: string = '1y';

  @ApiPropertyOptional({ enum: ['MUA', 'BAN'], description: 'Filter by action type' })
  @IsOptional()
  @IsEnum(['MUA', 'BAN'])
  action?: string;

  @ApiPropertyOptional({ description: 'Start date (YYYY-MM-DD). Overrides period if provided.' })
  @IsOptional()
  @IsString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'End date (YYYY-MM-DD). Overrides period if provided.' })
  @IsOptional()
  @IsString()
  toDate?: string;

  @ApiPropertyOptional({ description: 'Minimum unit price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Maximum unit price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  limit?: number = 20;
}
