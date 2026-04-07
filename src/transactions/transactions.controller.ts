import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard.js';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator.js';
import { TransactionsService } from './transactions.service.js';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { QueryTransactionDto } from './dto/query-transaction.dto.js';
import { BulkDeleteDto } from './dto/bulk-delete.dto.js';
import { TransactionResponseDto, TransactionListResponseDto, BulkDeleteResponseDto } from './dto/transaction-response.dto.js';
import { SuccessResponseDto } from '../common/dto/api-response.dto.js';

@ApiTags('Transactions')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('api/transactions')
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'List transactions with filter, search, pagination' })
  @ApiResponse({ status: 200, description: 'Paginated transactions list', type: TransactionListResponseDto })
  async findAll(@CurrentUser() user: AuthUser, @Query() query: QueryTransactionDto) {
    return this.transactionsService.findAll(user.id, query);
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recent transactions' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of recent transactions to return', example: 4 })
  @ApiResponse({ status: 200, description: 'Recent transactions', type: [TransactionResponseDto] })
  async findRecent(
    @CurrentUser() user: AuthUser,
    @Query('limit') limit?: number,
  ) {
    return this.transactionsService.findRecent(user.id, limit ? Number(limit) : 4);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new transaction' })
  @ApiResponse({ status: 201, description: 'Transaction created', type: TransactionResponseDto })
  @ApiResponse({ status: 400, description: 'Insufficient holdings for sell' })
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateTransactionDto) {
    return this.transactionsService.create(user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a transaction' })
  @ApiParam({ name: 'id', description: 'Transaction UUID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiResponse({ status: 200, description: 'Transaction deleted', type: SuccessResponseDto })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async delete(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.transactionsService.delete(user.id, id);
  }

  @Post('bulk-delete')
  @ApiOperation({ summary: 'Bulk delete transactions' })
  @ApiResponse({ status: 200, description: 'Transactions deleted', type: BulkDeleteResponseDto })
  async bulkDelete(@CurrentUser() user: AuthUser, @Body() dto: BulkDeleteDto) {
    return this.transactionsService.bulkDelete(user.id, dto.ids);
  }
}
