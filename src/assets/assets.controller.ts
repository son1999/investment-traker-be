import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard.js';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator.js';
import { AssetsService } from './assets.service.js';
import { AssetDetailResponseDto, AssetTransactionsResponseDto } from './dto/asset-response.dto.js';

@ApiTags('Assets')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('api/assets')
export class AssetsController {
  constructor(private assetsService: AssetsService) {}

  @Get(':code')
  @ApiOperation({ summary: 'Get detailed asset information (FIFO P&L, holdings, metrics)' })
  @ApiParam({ name: 'code', description: 'Asset code', example: 'SJC' })
  @ApiResponse({ status: 200, description: 'Asset detail', type: AssetDetailResponseDto })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async getAssetDetail(
    @CurrentUser() user: AuthUser,
    @Param('code') code: string,
  ) {
    return this.assetsService.getAssetDetail(user.id, code);
  }

  @Get(':code/transactions')
  @ApiOperation({ summary: 'Get transactions for a specific asset with pagination' })
  @ApiParam({ name: 'code', description: 'Asset code', example: 'SJC' })
  @ApiQuery({ name: 'period', required: false, enum: ['1m', '3m', '6m', '1y', 'all'], description: 'Time period filter', example: '1y' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page', example: 20 })
  @ApiResponse({ status: 200, description: 'Asset transactions', type: AssetTransactionsResponseDto })
  async getAssetTransactions(
    @CurrentUser() user: AuthUser,
    @Param('code') code: string,
    @Query('period') period?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.assetsService.getAssetTransactions(
      user.id,
      code,
      period || '1y',
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }
}
