import { ApiProperty } from '@nestjs/swagger';

export class PortfolioSummaryResponseDto {
  @ApiProperty({ example: 500000000, description: 'Total current portfolio value in VND' })
  totalValue: number;

  @ApiProperty({ example: 450000000, description: 'Total capital invested in VND' })
  capitalInvested: number;

  @ApiProperty({ example: 50000000, description: 'Total unrealized profit in VND' })
  profit: number;

  @ApiProperty({ example: 11.11, description: 'Profit percentage' })
  profitPercentage: number;

  @ApiProperty({ example: 5, description: 'Number of distinct assets held' })
  assetsCount: number;

  @ApiProperty({ example: 12, description: 'Total number of buy orders' })
  buyOrdersCount: number;

  @ApiProperty({ example: ['SJC', 'BTC', 'VNM'], description: 'List of held asset codes' })
  assetCodes: string[];
}

export class HoldingResponseDto {
  @ApiProperty({ example: 'SJC' })
  assetCode: string;

  @ApiProperty({ enum: ['metal', 'crypto', 'stock'], example: 'metal' })
  assetType: string;

  @ApiProperty({ example: 'SJC' })
  name: string;

  @ApiProperty({ example: '🥇' })
  icon: string;

  @ApiProperty({ example: 'rgba(248,160,16,0.2)' })
  iconBg: string;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: 82500000, description: 'Average buy cost per unit in VND' })
  averageCost: number;

  @ApiProperty({ example: 92500000, description: 'Current market price per unit in VND' })
  currentPrice: number;

  @ApiProperty({ example: 185000000, description: 'Total current value in VND' })
  value: number;

  @ApiProperty({ example: 12.12, description: 'Profit/loss percentage' })
  profitLossPercent: number;

  @ApiProperty({ example: 20000000, description: 'Profit/loss amount in VND' })
  profitLossAmount: number;

  @ApiProperty({ example: true })
  positive: boolean;
}

export class PortfolioAllocationResponseDto {
  @ApiProperty({ enum: ['metal', 'crypto', 'stock'], example: 'metal' })
  assetType: string;

  @ApiProperty({ example: 'Metal' })
  label: string;

  @ApiProperty({ example: 45.5, description: 'Allocation percentage' })
  value: number;

  @ApiProperty({ example: 185000000, description: 'Total value for this type in VND' })
  amount: number;
}

export class ProfitByAssetResponseDto {
  @ApiProperty({ example: 'SJC' })
  symbol: string;

  @ApiProperty({ example: 12.12 })
  profitPercent: number;

  @ApiProperty({ example: true })
  positive: boolean;
}

export class HistoryPointDto {
  @ApiProperty({ example: '2025-01-01' })
  date: string;

  @ApiProperty({ example: 450000000 })
  value: number;
}

export class PortfolioHistoryResponseDto {
  @ApiProperty({ example: '6m' })
  period: string;

  @ApiProperty({ type: [HistoryPointDto] })
  points: HistoryPointDto[];
}
