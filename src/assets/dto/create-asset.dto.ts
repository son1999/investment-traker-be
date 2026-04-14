import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsPositive, IsString, Min, MinLength, ValidateIf } from 'class-validator';
import { ASSET_TYPES } from '../../common/constants/asset-types.js';

export class CreateAssetDto {
  @ApiProperty({ example: 'SJC', description: 'Unique asset code' })
  @IsString()
  @MinLength(1)
  code: string;

  @ApiProperty({ example: 'Vàng SJC', description: 'Display name' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ enum: [...ASSET_TYPES], example: 'metal' })
  @IsEnum(ASSET_TYPES)
  type: string;

  @ApiPropertyOptional({ example: 'USDT', description: 'Currency code for this asset (default: VND)' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ example: '🥇', description: 'Icon emoji' })
  @IsString()
  icon: string;

  @ApiProperty({ example: 'rgba(248,160,16,0.2)', description: 'Icon background color' })
  @IsString()
  iconBg: string;

  // Savings-specific fields
  @ApiPropertyOptional({ example: 5.5, description: 'Annual interest rate (%) - required for savings' })
  @ValidateIf((o) => o.type === 'savings')
  @IsNumber()
  @IsPositive()
  interestRate?: number;

  @ApiPropertyOptional({ example: 12, description: 'Savings term in months - required for savings' })
  @ValidateIf((o) => o.type === 'savings')
  @IsNumber()
  @Min(1)
  termMonths?: number;

  @ApiPropertyOptional({ example: 'Vietcombank', description: 'Bank name - for savings' })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({ example: '2026-01-15', description: 'Maturity date - for savings' })
  @IsOptional()
  @IsString()
  maturityDate?: string;

  @ApiPropertyOptional({ example: 10000000, description: 'Initial deposit amount - required for savings' })
  @ValidateIf((o) => o.type === 'savings')
  @IsNumber()
  @IsPositive()
  principalAmount?: number;
}
