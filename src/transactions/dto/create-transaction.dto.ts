import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
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

  @ApiProperty({ example: 2 })
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiProperty({ example: 82500000 })
  @IsNumber()
  @IsPositive()
  unitPrice: number;

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
