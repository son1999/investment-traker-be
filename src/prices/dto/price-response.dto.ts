import { ApiProperty } from '@nestjs/swagger';

export class PriceResponseDto {
  @ApiProperty({ example: 'uuid-1234-5678' })
  id: string;

  @ApiProperty({ example: 'SJC' })
  code: string;

  @ApiProperty({ example: '🥇' })
  icon: string;

  @ApiProperty({ enum: ['metal', 'crypto', 'stock'], example: 'metal' })
  type: string;

  @ApiProperty({ example: 92500000 })
  price: number;

  @ApiProperty({ example: 'VND', description: 'Currency the price is denominated in' })
  currency: string;

  @ApiProperty({ example: '2025-01-15T10:30:00.000Z' })
  updatedAt: string;
}
