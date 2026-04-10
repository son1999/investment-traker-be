import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ASSET_TYPES } from '../../common/constants/asset-types.js';

export class CreatePriceDto {
  @ApiProperty({ example: 'SJC' })
  @IsString()
  code: string;

  @ApiProperty({ example: '🥇' })
  @IsString()
  icon: string;

  @ApiProperty({ enum: [...ASSET_TYPES] })
  @IsEnum(ASSET_TYPES)
  type: string;

  @ApiProperty({ example: 92500000 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 'VND', description: 'Currency the price is denominated in (default: VND)' })
  @IsOptional()
  @IsString()
  currency?: string;
}
