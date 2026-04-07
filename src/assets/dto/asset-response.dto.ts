import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationMeta } from '../../common/dto/api-response.dto.js';

class HoldingsMetric {
  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: 'SJC' })
  unit: string;

  @ApiProperty({ example: '3 lệnh mua · 1 lệnh bán' })
  detail: string;
}

class CurrencyValue {
  @ApiProperty({ example: 82500000 })
  value: number;

  @ApiProperty({ example: 'VND' })
  currency: string;
}

class CurrentPriceMetric extends CurrencyValue {
  @ApiPropertyOptional({ example: '2025-01-15T10:30:00.000Z' })
  updatedAt: string | null;
}

class ProfitMetric {
  @ApiProperty({ example: 20000000 })
  amount: number;

  @ApiProperty({ example: 12.12 })
  percent: number;

  @ApiProperty({ example: true })
  positive: boolean;
}

class AssetMetrics {
  @ApiProperty({ type: HoldingsMetric })
  holdings: HoldingsMetric;

  @ApiProperty({ type: CurrencyValue })
  avgCost: CurrencyValue;

  @ApiProperty({ type: CurrentPriceMetric })
  currentPrice: CurrentPriceMetric;

  @ApiProperty({ type: ProfitMetric })
  profit: ProfitMetric;
}

class RealizedTransaction {
  @ApiProperty({ example: '2025-06-15' })
  date: string;

  @ApiProperty({ example: 1 })
  quantity: number;

  @ApiProperty({ example: 92500000 })
  sellPrice: number;

  @ApiProperty({ example: 10000000 })
  profit: number;
}

class RealizedPnl {
  @ApiProperty({ example: 10000000 })
  total: number;

  @ApiProperty({ type: [RealizedTransaction] })
  transactions: RealizedTransaction[];
}

class UnrealizedPnl {
  @ApiProperty({ example: 20000000 })
  total: number;

  @ApiProperty({ example: 185000000 })
  currentValue: number;

  @ApiProperty({ example: 165000000 })
  totalCost: number;
}

class ValueHistoryPoint {
  @ApiProperty({ example: '2025-01-15' })
  date: string;

  @ApiProperty({ example: 185000000 })
  value: number;
}

export class AssetDetailResponseDto {
  @ApiProperty({ example: 'SJC' })
  assetCode: string;

  @ApiProperty({ enum: ['metal', 'crypto', 'stock'], example: 'metal' })
  assetType: string;

  @ApiProperty({ example: '🥇' })
  icon: string;

  @ApiProperty({ example: 'rgba(248,160,16,0.2)' })
  iconBg: string;

  @ApiProperty({ type: AssetMetrics })
  metrics: AssetMetrics;

  @ApiProperty({ type: RealizedPnl })
  realizedPnl: RealizedPnl;

  @ApiProperty({ type: UnrealizedPnl })
  unrealizedPnl: UnrealizedPnl;

  @ApiProperty({ type: [ValueHistoryPoint] })
  valueHistory: ValueHistoryPoint[];
}

export class AssetTransactionItemDto {
  @ApiProperty({ example: 'uuid-1234-5678' })
  id: string;

  @ApiProperty({ example: '2025-01-15' })
  date: string;

  @ApiProperty({ enum: ['MUA', 'BAN'], example: 'MUA' })
  action: string;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: 82500000 })
  unitPrice: number;

  @ApiProperty({ example: 165000000 })
  total: number;

  @ApiPropertyOptional({ example: 'Mua dip Tet' })
  note: string | null;
}

export class AssetTransactionsResponseDto {
  @ApiProperty({ type: [AssetTransactionItemDto] })
  data: AssetTransactionItemDto[];

  @ApiProperty({ type: PaginationMeta })
  meta: PaginationMeta;
}
