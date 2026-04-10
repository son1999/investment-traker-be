import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard.js';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator.js';
import { AssetsService } from './assets.service.js';
import { CreateAssetDto } from './dto/create-asset.dto.js';
import { UpdateAssetDto } from './dto/update-asset.dto.js';
import { QueryAssetTransactionsDto } from './dto/query-asset-transactions.dto.js';

@ApiTags('Assets')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('api/assets')
export class AssetsController {
  constructor(private assetsService: AssetsService) {}

  // ─── CRUD ──────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List all assets, optionally filtered by type' })
  @ApiQuery({ name: 'type', required: false, enum: ['metal', 'crypto', 'stock', 'savings'] })
  async findAll(
    @CurrentUser() user: AuthUser,
    @Query('type') type?: string,
  ) {
    return this.assetsService.findAll(user.id, type);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new investment asset' })
  async create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateAssetDto,
  ) {
    return this.assetsService.create(user.id, dto);
  }

  @Patch(':code')
  @ApiOperation({ summary: 'Update an asset by code' })
  @ApiParam({ name: 'code', description: 'Asset code', example: 'SJC' })
  async update(
    @CurrentUser() user: AuthUser,
    @Param('code') code: string,
    @Body() dto: UpdateAssetDto,
  ) {
    return this.assetsService.update(user.id, code, dto);
  }

  @Delete(':code')
  @ApiOperation({ summary: 'Delete an asset (only if no transactions exist)' })
  @ApiParam({ name: 'code', description: 'Asset code', example: 'SJC' })
  async delete(
    @CurrentUser() user: AuthUser,
    @Param('code') code: string,
  ) {
    return this.assetsService.delete(user.id, code);
  }

  // ─── DETAIL & TRANSACTIONS ─────────────────────────────

  @Get(':code/detail')
  @ApiOperation({ summary: 'Get detailed asset info (FIFO P&L, holdings, metrics)' })
  @ApiParam({ name: 'code', description: 'Asset code', example: 'SJC' })
  async getAssetDetail(
    @CurrentUser() user: AuthUser,
    @Param('code') code: string,
  ) {
    return this.assetsService.getAssetDetail(user.id, code);
  }

  @Get(':code/transactions')
  @ApiOperation({ summary: 'Get transactions for a specific asset with pagination and filters' })
  @ApiParam({ name: 'code', description: 'Asset code', example: 'SJC' })
  async getAssetTransactions(
    @CurrentUser() user: AuthUser,
    @Param('code') code: string,
    @Query() query: QueryAssetTransactionsDto,
  ) {
    return this.assetsService.getAssetTransactions(user.id, code, query);
  }
}
