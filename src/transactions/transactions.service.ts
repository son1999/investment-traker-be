import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { QueryTransactionDto } from './dto/query-transaction.dto.js';
import { toDateStr } from '../common/helpers/period.helper.js';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, query: QueryTransactionDto) {
    const { filter, search, page = 1, limit = 20 } = query;

    const where: any = { userId };
    if (filter) where.assetType = filter;
    if (search) where.assetCode = { contains: search, mode: 'insensitive' };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      data: data.map((t) => ({ ...t, date: toDateStr(t.date) })),
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findRecent(userId: string, limit: number = 4) {
    const data = await this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: limit,
    });
    return data.map((t) => ({ ...t, date: toDateStr(t.date) }));
  }

  async create(userId: string, dto: CreateTransactionDto) {
    if (dto.action === 'BAN') {
      const holdings = await this.prisma.transaction.findMany({
        where: { userId, assetCode: dto.assetCode },
        select: { action: true, quantity: true },
      });

      let totalHolding = 0;
      holdings.forEach((t) => {
        if (t.action === 'MUA') totalHolding += t.quantity;
        else totalHolding -= t.quantity;
      });

      if (dto.quantity > totalHolding) {
        throw new BadRequestException(
          `Insufficient holdings. Available: ${totalHolding}, requested: ${dto.quantity}`,
        );
      }
    }

    const created = await this.prisma.transaction.create({
      data: {
        userId,
        date: new Date(dto.date),
        assetType: dto.assetType,
        assetCode: dto.assetCode,
        action: dto.action,
        quantity: dto.quantity,
        unitPrice: dto.unitPrice,
        note: dto.note || null,
        icon: dto.icon,
        iconBg: dto.iconBg,
      },
    });

    return { ...created, date: toDateStr(created.date) };
  }

  async delete(userId: string, id: string) {
    const record = await this.prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!record) {
      throw new NotFoundException('Transaction not found');
    }

    await this.prisma.transaction.delete({ where: { id } });
    return { success: true };
  }

  async bulkDelete(userId: string, ids: string[]) {
    const result = await this.prisma.transaction.deleteMany({
      where: { id: { in: ids }, userId },
    });
    return { deleted: result.count };
  }
}
