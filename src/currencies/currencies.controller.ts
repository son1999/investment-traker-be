import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard.js';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator.js';
import { CurrenciesService } from './currencies.service.js';
import { CreateCurrencyDto } from './dto/create-currency.dto.js';
import { UpdateCurrencyDto } from './dto/update-currency.dto.js';

@ApiTags('Currencies')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('api/currencies')
export class CurrenciesController {
  constructor(private currenciesService: CurrenciesService) {}

  @Get()
  @ApiOperation({ summary: 'List all currencies with exchange rates' })
  async findAll(@CurrentUser() user: AuthUser) {
    return this.currenciesService.findAll(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new currency' })
  async create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateCurrencyDto,
  ) {
    return this.currenciesService.create(user.id, dto);
  }

  @Patch(':code')
  @ApiOperation({ summary: 'Update currency info or exchange rate' })
  @ApiParam({ name: 'code', description: 'Currency code', example: 'USDT' })
  async update(
    @CurrentUser() user: AuthUser,
    @Param('code') code: string,
    @Body() dto: UpdateCurrencyDto,
  ) {
    return this.currenciesService.update(user.id, code, dto);
  }

  @Delete(':code')
  @ApiOperation({ summary: 'Delete a currency (only if no assets use it)' })
  @ApiParam({ name: 'code', description: 'Currency code', example: 'USDT' })
  async delete(
    @CurrentUser() user: AuthUser,
    @Param('code') code: string,
  ) {
    return this.currenciesService.delete(user.id, code);
  }
}
