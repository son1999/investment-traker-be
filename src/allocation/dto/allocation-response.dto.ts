import { ApiProperty } from '@nestjs/swagger';

export class CurrentAllocationItemDto {
  @ApiProperty({ enum: ['metal', 'crypto', 'stock'], example: 'metal' })
  assetType: string;

  @ApiProperty({ example: 'Metal' })
  name: string;

  @ApiProperty({ example: 185000000, description: 'Current value in VND' })
  value: number;

  @ApiProperty({ example: 45.5, description: 'Actual allocation percentage' })
  actualPercent: number;

  @ApiProperty({ example: 40, description: 'Target allocation percentage' })
  targetPercent: number;

  @ApiProperty({ enum: ['on-target', 'overweight', 'underweight'], example: 'overweight' })
  status: string;
}

export class SetTargetsResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 100 })
  total: number;
}

export class RebalanceActionDto {
  @ApiProperty({ enum: ['metal', 'crypto', 'stock'], example: 'crypto' })
  assetType: string;

  @ApiProperty({ enum: ['buy', 'sell'], example: 'buy' })
  action: string;

  @ApiProperty({ example: 25000000, description: 'Recommended trade amount in VND' })
  amount: number;

  @ApiProperty({ example: 'Buy ~25M VND of Crypto' })
  description: string;
}

export class RebalanceRecommendationResponseDto {
  @ApiProperty({ type: [RebalanceActionDto] })
  actions: RebalanceActionDto[];

  @ApiProperty({ example: 'Portfolio has deviated from strategic targets. Rebalancing recommended.' })
  summary: string;
}
