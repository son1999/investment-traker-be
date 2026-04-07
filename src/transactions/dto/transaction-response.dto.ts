import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationMeta } from '../../common/dto/api-response.dto.js';

export class TransactionResponseDto {
  @ApiProperty({ example: 'uuid-1234-5678' })
  id: string;

  @ApiProperty({ example: '2025-01-15' })
  date: string;

  @ApiProperty({ enum: ['metal', 'crypto', 'stock'], example: 'metal' })
  assetType: string;

  @ApiProperty({ example: 'SJC' })
  assetCode: string;

  @ApiProperty({ enum: ['MUA', 'BAN'], example: 'MUA' })
  action: string;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: 82500000 })
  unitPrice: number;

  @ApiPropertyOptional({ example: 'Mua dip Tet' })
  note?: string;

  @ApiProperty({ example: '🥇' })
  icon: string;

  @ApiProperty({ example: 'rgba(248,160,16,0.2)' })
  iconBg: string;
}

export class TransactionListResponseDto {
  @ApiProperty({ type: [TransactionResponseDto] })
  data: TransactionResponseDto[];

  @ApiProperty({ type: PaginationMeta })
  meta: PaginationMeta;
}

export class BulkDeleteResponseDto {
  @ApiProperty({ example: 3 })
  deleted: number;
}
