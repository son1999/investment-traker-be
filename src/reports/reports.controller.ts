import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard.js';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator.js';
import { ReportsService } from './reports.service.js';
import {
  PerformanceResponseDto,
  FinancialSummaryResponseDto,
  CashFlowItemDto,
  TopAssetItemDto,
  PerformanceComparisonItemDto,
  DcaChartResponseDto,
  DcaHistoryItemDto,
  DcaComparisonResponseDto,
} from './dto/reports-response.dto.js';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('api/reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('performance')
  @ApiOperation({ summary: 'Get performance data by asset type over time' })
  @ApiQuery({ name: 'period', required: false, enum: ['1m', '3m', '6m', '1y', 'all'], description: 'Time period filter', example: 'all' })
  @ApiResponse({ status: 200, description: 'Performance series data', type: PerformanceResponseDto })
  async getPerformance(
    @CurrentUser() user: AuthUser,
    @Query('period') period?: string,
  ) {
    return this.reportsService.getPerformance(user.id, period || 'all');
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get financial summary (deposited, withdrawn, realized & unrealized PnL)' })
  @ApiQuery({ name: 'period', required: false, enum: ['1m', '3m', '6m', '1y', 'all'], description: 'Time period filter', example: 'all' })
  @ApiResponse({ status: 200, description: 'Financial summary', type: FinancialSummaryResponseDto })
  async getSummary(
    @CurrentUser() user: AuthUser,
    @Query('period') period?: string,
  ) {
    return this.reportsService.getSummary(user.id, period || 'all');
  }

  @Get('cash-flow')
  @ApiOperation({ summary: 'Get monthly cash flow (inflow/outflow)' })
  @ApiQuery({ name: 'period', required: false, enum: ['1m', '3m', '6m', '1y', 'all'], description: 'Time period filter', example: 'all' })
  @ApiResponse({ status: 200, description: 'Cash flow data', type: [CashFlowItemDto] })
  async getCashFlow(
    @CurrentUser() user: AuthUser,
    @Query('period') period?: string,
  ) {
    return this.reportsService.getCashFlow(user.id, period || 'all');
  }

  @Get('top-assets')
  @ApiOperation({ summary: 'Get top performing assets ranked by portfolio value' })
  @ApiQuery({ name: 'period', required: false, enum: ['1m', '3m', '6m', '1y', 'all'], description: 'Time period filter', example: 'all' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of top assets to return', example: 5 })
  @ApiResponse({ status: 200, description: 'Top assets ranked', type: [TopAssetItemDto] })
  async getTopAssets(
    @CurrentUser() user: AuthUser,
    @Query('period') period?: string,
    @Query('limit') limit?: number,
  ) {
    return this.reportsService.getTopAssets(user.id, period || 'all', limit ? Number(limit) : 5);
  }

  @Get('performance-comparison')
  @ApiOperation({ summary: 'Compare performance across all held assets' })
  @ApiResponse({ status: 200, description: 'Performance comparison', type: [PerformanceComparisonItemDto] })
  async getPerformanceComparison(@CurrentUser() user: AuthUser) {
    return this.reportsService.getPerformanceComparison(user.id);
  }

  @Get('dca-chart')
  @ApiOperation({ summary: 'Get DCA chart data for an asset (purchase amounts & running avg cost)' })
  @ApiQuery({ name: 'code', required: true, description: 'Asset code', example: 'SJC' })
  @ApiResponse({ status: 200, description: 'DCA chart data', type: DcaChartResponseDto })
  async getDcaChart(
    @CurrentUser() user: AuthUser,
    @Query('code') code: string,
  ) {
    return this.reportsService.getDcaChart(user.id, code);
  }

  @Get('dca-history')
  @ApiOperation({ summary: 'Get DCA purchase history for an asset' })
  @ApiQuery({ name: 'code', required: true, description: 'Asset code', example: 'SJC' })
  @ApiResponse({ status: 200, description: 'DCA purchase history', type: [DcaHistoryItemDto] })
  async getDcaHistory(
    @CurrentUser() user: AuthUser,
    @Query('code') code: string,
  ) {
    return this.reportsService.getDcaHistory(user.id, code);
  }

  @Get('dca-comparison')
  @ApiOperation({ summary: 'Compare DCA vs lump sum investment strategy for an asset' })
  @ApiQuery({ name: 'code', required: true, description: 'Asset code', example: 'SJC' })
  @ApiResponse({ status: 200, description: 'DCA vs lump sum comparison', type: DcaComparisonResponseDto })
  async getDcaComparison(
    @CurrentUser() user: AuthUser,
    @Query('code') code: string,
  ) {
    return this.reportsService.getDcaComparison(user.id, code);
  }
}
