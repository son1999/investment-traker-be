import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard.js';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator.js';
import { AllocationService } from './allocation.service.js';
import { SetTargetsDto } from './dto/set-targets.dto.js';
import {
  CurrentAllocationItemDto,
  SetTargetsResponseDto,
  RebalanceRecommendationResponseDto,
} from './dto/allocation-response.dto.js';

@ApiTags('Allocation')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('api/allocation')
export class AllocationController {
  constructor(private allocationService: AllocationService) {}

  @Get('current')
  @ApiOperation({ summary: 'Get current allocation vs targets' })
  @ApiResponse({ status: 200, description: 'Current allocation data', type: [CurrentAllocationItemDto] })
  async getCurrent(@CurrentUser() user: AuthUser) {
    return this.allocationService.getCurrent(user.id);
  }

  @Post('targets')
  @ApiOperation({ summary: 'Set allocation targets (must sum to 100%)' })
  @ApiResponse({ status: 200, description: 'Targets saved', type: SetTargetsResponseDto })
  @ApiResponse({ status: 400, description: 'Percentages do not sum to 100' })
  async setTargets(
    @CurrentUser() user: AuthUser,
    @Body() dto: SetTargetsDto,
  ) {
    return this.allocationService.setTargets(user.id, dto);
  }

  @Get('recommendation')
  @ApiOperation({ summary: 'Get rebalancing recommendations' })
  @ApiResponse({ status: 200, description: 'Rebalancing recommendations', type: RebalanceRecommendationResponseDto })
  async getRecommendation(@CurrentUser() user: AuthUser) {
    return this.allocationService.getRecommendation(user.id);
  }
}
