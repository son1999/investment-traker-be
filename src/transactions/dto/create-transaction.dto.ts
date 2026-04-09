import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsPositive, IsString, ValidateIf } from 'class-validator';
import { ASSET_TYPES } from '../../common/constants/asset-types.js';

export class CreateTransactionDto {
  @ApiProperty({ example: '2025-01-15' })
  @IsDateString()
  date: string;

  @ApiProperty({ enum: [...ASSET_TYPES] })
  @IsEnum(ASSET_TYPES)
  assetType: string;

  @ApiProperty({ example: 'SJC' })
  @IsString()
  assetCode: string;

  @ApiProperty({ enum: ['MUA', 'BAN'] })
  @IsEnum(['MUA', 'BAN'])
  action: string;

  @ApiProperty({ example: 0.0023, description: 'Quantity (e.g. 0.0023 BTC, 100 shares, 0.5 chỉ vàng)' })
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiPropertyOptional({ example: 82500000, description: 'Unit price per 1 unit. Required if totalAmount not provided.' })
  @ValidateIf((o) => o.totalAmount === undefined || o.totalAmount === null)
  @IsNumber()
  @IsPositive()
  unitPrice?: number;

  @ApiPropertyOptional({ example: 27.24, description: 'Total amount spent/received. If provided, unitPrice = totalAmount / quantity.' })
  @ValidateIf((o) => o.unitPrice === undefined || o.unitPrice === null)
  @IsNumber()
  @IsPositive()
  totalAmount?: number;

  @ApiPropertyOptional({ example: 'Mua dip Tet' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({ example: '🥇' })
  @IsString()
  icon: string;

  @ApiProperty({ example: 'rgba(248,160,16,0.2)' })
  @IsString()
  iconBg: string;
}
