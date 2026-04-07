import { ApiProperty } from '@nestjs/swagger';

export class PaginationMeta {
  @ApiProperty({ example: 50 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 3 })
  pages: number;
}

export class SuccessResponseDto {
  @ApiProperty({ example: true })
  success: boolean;
}

export class ErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'Error message' })
  message: string;

  @ApiProperty({ example: 'Bad Request' })
  error: string;
}
