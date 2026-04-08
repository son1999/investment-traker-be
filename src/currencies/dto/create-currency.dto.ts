import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Min, MinLength } from 'class-validator';

export class CreateCurrencyDto {
  @ApiProperty({ example: 'USDT', description: 'Currency code' })
  @IsString()
  @MinLength(1)
  code: string;

  @ApiProperty({ example: 'Tether', description: 'Currency display name' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ example: '₮', description: 'Currency symbol' })
  @IsString()
  symbol: string;

  @ApiProperty({ example: 25400, description: 'Exchange rate to VND' })
  @IsNumber()
  @Min(0)
  rateToVnd: number;
}
