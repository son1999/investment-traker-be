import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsPositive, IsString, MinLength } from 'class-validator';

export const SAVINGS_EVENT_TYPES = ['DEPOSIT', 'WITHDRAW', 'INTEREST', 'FEE', 'MATURITY'] as const;
export type SavingsEventType = (typeof SAVINGS_EVENT_TYPES)[number];

export class CreateSavingsEventDto {
  @ApiProperty({ example: 'SAV-1776153721754', description: 'Savings asset code' })
  @IsString()
  @MinLength(1)
  assetCode: string;

  @ApiProperty({ enum: SAVINGS_EVENT_TYPES, example: 'DEPOSIT' })
  @IsEnum(SAVINGS_EVENT_TYPES)
  type: SavingsEventType;

  @ApiProperty({ example: 10000000, description: 'Amount in VND' })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ example: '2026-04-14', description: 'Event date (YYYY-MM-DD)' })
  @IsString()
  date: string;

  @ApiPropertyOptional({ example: 'Gửi thêm đầu tháng' })
  @IsOptional()
  @IsString()
  note?: string;
}
