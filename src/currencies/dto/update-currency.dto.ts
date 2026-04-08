import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class UpdateCurrencyDto {
  @ApiPropertyOptional({ example: 'Tether' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({ example: '₮' })
  @IsOptional()
  @IsString()
  symbol?: string;

  @ApiPropertyOptional({ example: 25400 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rateToVnd?: number;
}
