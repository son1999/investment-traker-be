import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard.js';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator.js';
import { PortfolioService } from './portfolio.service.js';
import {
  PortfolioSummaryResponseDto,
  HoldingResponseDto,
  PortfolioAllocationResponseDto,
  ProfitByAssetResponseDto,
  PortfolioHistoryResponseDto,
} from './dto/portfolio-response.dto.js';

@ApiTags('Portfolio')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('api/portfolio')
export class PortfolioController {
  constructor(private portfolioService: PortfolioService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get portfolio summary (total value, profit, holdings count)' })
  @ApiResponse({ status: 200, description: 'Portfolio summary', type: PortfolioSummaryResponseDto })
  async getSummary(@CurrentUser() user: AuthUser) {
    return this.portfolioService.getSummary(user.id);
  }

  @Get('holdings')
  @ApiOperation({ summary: 'Get current holdings breakdown' })
  @ApiResponse({ status: 200, description: 'Holdings list', type: [HoldingResponseDto] })
  async getHoldings(@CurrentUser() user: AuthUser) {
    return this.portfolioService.getHoldings(user.id);
  }

  @Get('allocation')
  @ApiOperation({ summary: 'Get portfolio allocation breakdown by asset type' })
  @ApiResponse({ status: 200, description: 'Allocation data', type: [PortfolioAllocationResponseDto] })
  async getAllocation(@CurrentUser() user: AuthUser) {
    return this.portfolioService.getAllocation(user.id);
  }

  @Get('profit-by-asset')
  @ApiOperation({ summary: 'Get profit/loss per asset' })
  @ApiResponse({ status: 200, description: 'Profit by asset', type: [ProfitByAssetResponseDto] })
  async getProfitByAsset(@CurrentUser() user: AuthUser) {
    return this.portfolioService.getProfitByAsset(user.id);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get portfolio value history over time' })
  @ApiQuery({ name: 'period', required: false, enum: ['1m', '3m', '6m', '1y', 'all'], description: 'Time period filter', example: '6m' })
  @ApiResponse({ status: 200, description: 'Portfolio history', type: PortfolioHistoryResponseDto })
  async getHistory(
    @CurrentUser() user: AuthUser,
    @Query('period') period?: string,
  ) {
    return this.portfolioService.getHistory(user.id, period || '6m');
  }
}
