import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDateString, IsNumber, IsOptional, IsPositive, IsString, MinLength } from 'class-validator';

export class CreateGoalDto {
  @ApiProperty({ example: 'Emergency Fund', description: 'Goal name' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ example: 100000000, description: 'Target amount in VND' })
  @IsNumber()
  @IsPositive()
  targetAmount: number;

  @ApiProperty({ example: '2027-01-01', description: 'Target deadline' })
  @IsDateString()
  deadline: string;

  @ApiPropertyOptional({ example: ['BTC', 'ETH'], description: 'Linked asset codes for auto progress tracking' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  linkedAssets?: string[];

  @ApiPropertyOptional({ example: 50000000, description: 'Manual current amount (when not linked to assets)' })
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
