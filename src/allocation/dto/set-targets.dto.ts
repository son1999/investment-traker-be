import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsEnum, IsNumber, Max, Min, ValidateNested } from 'class-validator';
import { ASSET_TYPES } from '../../common/constants/asset-types.js';

export class AllocationTargetItem {
  @ApiProperty({ enum: [...ASSET_TYPES] })
  @IsEnum(ASSET_TYPES)
  assetType: string;

  @ApiProperty({ example: 30 })
  @IsNumber()
  @Min(0)
  @Max(100)
  targetPercent: number;
}

export class SetTargetsDto {
  @ApiProperty({ type: [AllocationTargetItem] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AllocationTargetItem)
  targets: AllocationTargetItem[];
}
