import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateAssetDto {
  @ApiPropertyOptional({ example: 'Vàng SJC 9999' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({ enum: ['metal', 'crypto', 'stock'] })
  @IsOptional()
  @IsEnum(['metal', 'crypto', 'stock'])
  type?: string;

  @ApiPropertyOptional({ example: '🥇' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ example: 'rgba(248,160,16,0.2)' })
  @IsOptional()
  @IsString()
  iconBg?: string;
}
