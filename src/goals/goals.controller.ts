import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard.js';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator.js';
import { GoalsService } from './goals.service.js';
import { CreateGoalDto } from './dto/create-goal.dto.js';
import { UpdateGoalDto } from './dto/update-goal.dto.js';
import { GoalResponseDto, GoalSummaryResponseDto } from './dto/goal-response.dto.js';
import { SuccessResponseDto } from '../common/dto/api-response.dto.js';

@ApiTags('Goals')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('api/goals')
export class GoalsController {
  constructor(private goalsService: GoalsService) {}

  @Get()
  @ApiOperation({ summary: 'List all financial goals with progress' })
  @ApiResponse({ status: 200, description: 'List of goals', type: [GoalResponseDto] })
  async findAll(@CurrentUser() user: AuthUser) {
    return this.goalsService.findAll(user.id);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get goals summary (total, on-track, at-risk, completed)' })
  @ApiResponse({ status: 200, description: 'Goals summary', type: GoalSummaryResponseDto })
  async getSummary(@CurrentUser() user: AuthUser) {
    return this.goalsService.getSummary(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific goal with detailed progress' })
  @ApiParam({ name: 'id', description: 'Goal UUID' })
  @ApiResponse({ status: 200, description: 'Goal detail', type: GoalResponseDto })
  async findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.goalsService.findOne(user.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new financial goal' })
  @ApiResponse({ status: 201, description: 'Goal created', type: GoalResponseDto })
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateGoalDto) {
    return this.goalsService.create(user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a financial goal' })
  @ApiParam({ name: 'id', description: 'Goal UUID' })
  @ApiResponse({ status: 200, description: 'Goal updated', type: GoalResponseDto })
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateGoalDto,
  ) {
    return this.goalsService.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a financial goal' })
  @ApiParam({ name: 'id', description: 'Goal UUID' })
  @ApiResponse({ status: 200, description: 'Goal deleted', type: SuccessResponseDto })
  async delete(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.goalsService.delete(user.id, id);
  }
}
