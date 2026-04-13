import { ApiProperty } from '@nestjs/swagger';

class PerformanceSeries {
  @ApiProperty({ type: [Number], example: [100000000, 120000000, 130000000] })
  metal: number[];

  @ApiProperty({ type: [Number], example: [50000000, 55000000, 60000000] })
  crypto: number[];

  @ApiProperty({ type: [Number], example: [80000000, 85000000, 90000000] })
  stock: number[];
}

export class PerformanceResponseDto {
  @ApiProperty({ type: [String], example: ['Jan', 'Feb', 'Mar'] })
  months: string[];

  @ApiProperty({ type: PerformanceSeries })
  series: PerformanceSeries;
}

export class FinancialSummaryResponseDto {
  @ApiProperty({ example: 500000000, description: 'Total amount deposited (bought) in VND' })
  totalDeposited: number;

  @ApiProperty({ example: 100000000, description: 'Total amount withdrawn (sold) in VND' })
  totalWithdrawn: number;

  @ApiProperty({ example: 10000000, description: 'Realized profit/loss in VND' })
  realizedPnl: number;

  @ApiProperty({ example: 40000000, description: 'Unrealized profit/loss in VND' })
  unrealizedPnl: number;
}

export class CashFlowItemDto {
  @ApiProperty({ example: '2025-01', description: 'Month in YYYY-MM format' })
  month: string;

  @ApiProperty({ example: 165000000, description: 'Total buy amount in VND' })
  inflow: number;

  @ApiProperty({ example: 92500000, description: 'Total sell amount in VND' })
  outflow: number;
}

export class TopAssetItemDto {
  @ApiProperty({ example: 1 })
  rank: number;

  @ApiProperty({ example: 'SJC' })
  assetCode: string;

  @ApiProperty({ example: 'SJC' })
  name: string;

  @ApiProperty({ example: '🥇' })
  icon: string;

  @ApiProperty({ example: 165000000 })
  invested: number;

  @ApiProperty({ example: 185000000 })
  currentValue: number;

  @ApiProperty({ example: 12.12 })
  profitLossPercent: number;

  @ApiProperty({ example: 20000000 })
  profitLossAmount: number;

  @ApiProperty({ example: true })
  positive: boolean;

  @ApiProperty({ example: 45.5, description: 'Weight in portfolio (%)' })
  weight: number;
}

export class PerformanceComparisonItemDto {
  @ApiProperty({ example: 'SJC' })
  name: string;

  @ApiProperty({ example: 'SJC' })
  assetCode: string;

  @ApiProperty({ example: 165000000 })
  invested: number;

  @ApiProperty({ example: 185000000 })
  currentValue: number;

  @ApiProperty({ example: 12.12 })
  profitPercent: number;

  @ApiProperty({ example: true })
  positive: boolean;
}

export class DcaChartResponseDto {
  @ApiProperty({ example: 'SJC' })
  assetCode: string;

  @ApiProperty({ example: 6, description: 'Number of DCA purchases' })
  numPurchases: number;

  @ApiProperty({ example: 30, description: 'Average interval between purchases in days' })
  avgIntervalDays: number;

  @ApiProperty({ example: 27500000, description: 'Average amount per purchase in VND' })
  avgPerPurchase: number;

  @ApiProperty({ type: [Number], example: [25000000, 30000000, 27500000], description: 'Amount of each purchase' })
  purchaseAmounts: number[];

  @ApiProperty({ type: [Number], example: [82000000, 83500000, 83000000], description: 'Running average cost after each purchase' })
  avgCostPrices: number[];

  @ApiProperty({ example: 92500000 })
  currentPrice: number;
}

export class DcaHistoryItemDto {
  @ApiProperty({ example: 1, description: 'Purchase sequence number' })
  number: number;

  @ApiProperty({ example: '2025-01-15' })
  date: string;

  @ApiProperty({ example: 82500000 })
  unitPrice: number;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: 165000000 })
  total: number;
}

class DcaResultDto {
  @ApiProperty({ example: 83000000 })
  avgCost: number;

  @ApiProperty({ example: 165000000 })
  totalCapital: number;

  @ApiProperty({ example: 185000000 })
  currentValue: number;

  @ApiProperty({ example: 20000000 })
  profit: number;

  @ApiProperty({ example: 12.12 })
  profitPercent: number;
}

class LumpSumResultDto {
  @ApiProperty({ example: 82000000 })
  priceAtFirstBuy: number;

  @ApiProperty({ example: 165000000 })
  totalCapital: number;

  @ApiProperty({ example: 186000000 })
  currentValue: number;

  @ApiProperty({ example: 21000000 })
  profit: number;

  @ApiProperty({ example: 12.73 })
  profitPercent: number;
}

export class DcaComparisonResponseDto {
  @ApiProperty({ example: 'USDT' })
  currency: string;

  @ApiProperty({ type: DcaResultDto })
  dca: DcaResultDto;

  @ApiProperty({ type: LumpSumResultDto })
  lumpSum: LumpSumResultDto;
}
