import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDateString, IsNumber, IsOptional, IsPositive, IsString, MinLength } from 'class-validator';

export class UpdateGoalDto {
  @ApiPropertyOptional({ example: 'Emergency Fund' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({ example: 100000000 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  targetAmount?: number;

  @ApiPropertyOptional({ example: '2027-01-01' })
  @IsOptional()
  @IsDateString()
  deadline?: string;

  @ApiPropertyOptional({ example: ['BTC', 'ETH'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  linkedAssets?: string[];

  @ApiPropertyOptional({ example: 50000000 })
  @IsOptional()
  @IsNumber()
  currentAmount?: number;

  @ApiPropertyOptional({ example: '🎯' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ example: 'rgba(59,130,246,0.2)' })
  @IsOptional()
  @IsString()
  iconBg?: string;
}
