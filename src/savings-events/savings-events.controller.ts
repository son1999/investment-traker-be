import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard.js';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator.js';
import { SavingsEventsService } from './savings-events.service.js';
import { CreateSavingsEventDto } from './dto/create-savings-event.dto.js';

@ApiTags('Savings Events')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('api/savings-events')
export class SavingsEventsController {
  constructor(private service: SavingsEventsService) {}

  @Get()
  @ApiOperation({ summary: 'List savings events for an asset' })
  async findByAsset(@CurrentUser() user: AuthUser, @Query('assetCode') assetCode: string) {
    return this.service.findByAsset(user.id, assetCode);
  }

  @Post()
  @ApiOperation({ summary: 'Create a savings event (deposit, withdraw, interest, fee, maturity)' })
  @ApiResponse({ status: 201, description: 'Savings event created' })
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateSavingsEventDto) {
    return this.service.create(user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a savings event' })
  async delete(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.delete(user.id, id);
  }
}
