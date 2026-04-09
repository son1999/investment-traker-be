import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GoalProgressDto {
  @ApiProperty({ example: 50000000 })
  currentValue: number;

  @ApiProperty({ example: 100000000 })
  targetAmount: number;

  @ApiProperty({ example: 50.0 })
  progressPercent: number;

  @ApiProperty({ example: 50000000 })
  remainingAmount: number;

  @ApiProperty({ example: 365 })
  daysRemaining: number;

  @ApiProperty({ example: true })
  onTrack: boolean;
}

export class GoalResponseDto {
  @ApiProperty({ example: 'uuid-1234' })
  id: string;

  @ApiProperty({ example: 'Emergency Fund' })
  name: string;

  @ApiProperty({ example: 100000000 })
  targetAmount: number;

  @ApiProperty({ example: '2027-01-01' })
  deadline: string;

  @ApiPropertyOptional({ example: ['BTC', 'ETH'] })
  linkedAssets: string[];

  @ApiPropertyOptional({ example: 50000000 })
  currentAmount: number | null;

  @ApiProperty({ example: '🎯' })
  icon: string;

  @ApiProperty({ example: 'rgba(59,130,246,0.2)' })
  iconBg: string;

  @ApiProperty({ type: GoalProgressDto })
  progress: GoalProgressDto;
}

export class GoalSummaryResponseDto {
  @ApiProperty({ example: 3 })
  totalGoals: number;

  @ApiProperty({ example: 2 })
  onTrackCount: number;

  @ApiProperty({ example: 1 })
  atRiskCount: number;

  @ApiProperty({ example: 0 })
  completedCount: number;
}
