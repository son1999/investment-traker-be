import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsPositive, IsString, Min, MinLength } from 'class-validator';
import { ASSET_TYPES } from '../../common/constants/asset-types.js';

export class UpdateAssetDto {
  @ApiPropertyOptional({ example: 'Vàng SJC 9999' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({ enum: [...ASSET_TYPES] })
  @IsOptional()
  @IsEnum(ASSET_TYPES)
  type?: string;

  @ApiPropertyOptional({ example: '🥇' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ example: 'rgba(248,160,16,0.2)' })
  @IsOptional()
  @IsString()
  iconBg?: string;

  // Savings-specific fields
  @ApiPropertyOptional({ example: 5.5, description: 'Annual interest rate (%)' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  interestRate?: number;

  @ApiPropertyOptional({ example: 12, description: 'Savings term in months' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  termMonths?: number;

  @ApiPropertyOptional({ example: 'Vietcombank', description: 'Bank name' })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({ example: '2026-01-15', description: 'Maturity date' })
  @IsOptional()
  @IsString()
  maturityDate?: string;
}
