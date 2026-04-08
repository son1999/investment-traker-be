import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateAssetDto {
  @ApiProperty({ example: 'SJC', description: 'Unique asset code' })
  @IsString()
  @MinLength(1)
  code: string;

  @ApiProperty({ example: 'Vàng SJC', description: 'Display name' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ enum: ['metal', 'crypto', 'stock'], example: 'metal' })
  @IsEnum(['metal', 'crypto', 'stock'])
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
}
