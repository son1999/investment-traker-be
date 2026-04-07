import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class UpdatePriceDto {
  @ApiProperty({ example: 95000000 })
  @IsNumber()
  @Min(0)
  price: number;
}
