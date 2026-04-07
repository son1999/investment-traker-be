import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsString, Min } from 'class-validator';

export class CreatePriceDto {
  @ApiProperty({ example: 'SJC' })
  @IsString()
  code: string;

  @ApiProperty({ example: '🥇' })
  @IsString()
  icon: string;

  @ApiProperty({ enum: ['metal', 'crypto', 'stock'] })
  @IsEnum(['metal', 'crypto', 'stock'])
  type: string;

  @ApiProperty({ example: 92500000 })
  @IsNumber()
  @Min(0)
  price: number;
}
