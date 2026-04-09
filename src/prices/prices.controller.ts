import { Body, Controller, Get, Param, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard.js';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator.js';
import { PricesService } from './prices.service.js';
import { PriceFetcherService } from './price-fetcher.service.js';
import { CreatePriceDto } from './dto/create-price.dto.js';
import { UpdatePriceDto } from './dto/update-price.dto.js';
import { PriceResponseDto } from './dto/price-response.dto.js';

@ApiTags('Prices')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('api/prices')
export class PricesController {
  constructor(
    private pricesService: PricesService,
    private priceFetcherService: PriceFetcherService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all prices, optionally filtered by type' })
  @ApiQuery({ name: 'type', required: false, enum: ['metal', 'crypto', 'stock', 'savings'], description: 'Filter prices by asset type' })
  @ApiResponse({ status: 200, description: 'List of prices', type: [PriceResponseDto] })
  async findAll(
    @CurrentUser() user: AuthUser,
    @Query('type') type?: string,
  ) {
    return this.pricesService.findAll(user.id, type);
  }

  @Post()
  @ApiOperation({ summary: 'Create or update a price entry' })
  @ApiResponse({ status: 200, description: 'Price updated (existing entry)', type: PriceResponseDto })
  @ApiResponse({ status: 201, description: 'Price created (new entry)', type: PriceResponseDto })
  async createOrUpdate(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreatePriceDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.pricesService.createOrUpdate(user.id, dto);
    res.status(result.status);
    return result.data;
  }

  @Patch(':code')
  @ApiOperation({ summary: 'Update price by asset code' })
  @ApiParam({ name: 'code', description: 'Asset code', example: 'SJC' })
  @ApiResponse({ status: 200, description: 'Price updated', type: PriceResponseDto })
  @ApiResponse({ status: 404, description: 'Price not found' })
  async updateByCode(
    @CurrentUser() user: AuthUser,
    @Param('code') code: string,
    @Body() dto: UpdatePriceDto,
  ) {
    return this.pricesService.updateByCode(user.id, code, dto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh all asset prices from external APIs (CoinGecko, VnStock)' })
  @ApiResponse({ status: 200, description: 'Refresh result with updated prices' })
  async refreshPrices(@CurrentUser() user: AuthUser) {
    return this.priceFetcherService.refreshAllPrices(user.id);
  }

  @Get(':code/live')
  @ApiOperation({ summary: 'Get live price for a specific asset (with cache)' })
  @ApiParam({ name: 'code', description: 'Asset code', example: 'BTC' })
  @ApiQuery({ name: 'type', required: true, enum: ['crypto', 'stock'], description: 'Asset type' })
  @ApiResponse({ status: 200, description: 'Live price' })
  async getLivePrice(
    @CurrentUser() user: AuthUser,
    @Param('code') code: string,
    @Query('type') type: string,
  ) {
    const price = await this.priceFetcherService.getLivePrice(code, type);
    return { code, type, price };
  }
}
