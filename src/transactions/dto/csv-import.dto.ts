import { ApiProperty } from '@nestjs/swagger';

export class CsvImportErrorDto {
  @ApiProperty({ example: 2 })
  row: number;

  @ApiProperty({ example: 'Invalid assetType: unknown' })
  message: string;
}

export class CsvImportResultDto {
  @ApiProperty({ example: 10 })
  successCount: number;

  @ApiProperty({ example: 2 })
  errorCount: number;

  @ApiProperty({ type: [CsvImportErrorDto] })
  errors: CsvImportErrorDto[];
}
