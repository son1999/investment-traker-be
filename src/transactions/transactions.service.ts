import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { I18nService } from '../i18n/i18n.service.js';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { QueryTransactionDto } from './dto/query-transaction.dto.js';
import { toDateStr } from '../common/helpers/period.helper.js';
import { parseCsvBuffer, type CsvParseError } from './helpers/csv-parser.helper.js';

@Injectable()
export class TransactionsService {
  constructor(
    private prisma: PrismaService,
    private i18n: I18nService,
  ) {}

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
    // Calculate unitPrice from totalAmount if not provided
    const unitPrice = dto.unitPrice ?? (dto.totalAmount! / dto.quantity);

    const asset = await this.prisma.asset.findUnique({
      where: { userId_code: { userId, code: dto.assetCode } },
    });
    if (!asset) {
      throw new BadRequestException(
        this.i18n.t('ASSET_NOT_REGISTERED', { code: dto.assetCode }),
      );
    }

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
          this.i18n.t('INSUFFICIENT_HOLDINGS', {
            available: totalHolding,
            requested: dto.quantity,
          }),
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
        unitPrice,
        currency: asset.currency,
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
      throw new NotFoundException(this.i18n.t('TRANSACTION_NOT_FOUND'));
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

  async importCsv(userId: string, buffer: Buffer) {
    const { parsed, errors } = parseCsvBuffer(buffer);

    if (parsed.length === 0) {
      return { successCount: 0, errorCount: errors.length, errors };
    }

    // Load all user assets for validation
    const assets = await this.prisma.asset.findMany({
      where: { userId },
      select: { code: true, currency: true, icon: true, iconBg: true },
    });
    const assetMap = new Map(assets.map((a) => [a.code, a]));

    // Load current holdings for sell validation
    const transactions = await this.prisma.transaction.findMany({
      where: { userId },
      select: { assetCode: true, action: true, quantity: true },
    });
    const holdingsMap = new Map<string, number>();
    transactions.forEach((t) => {
      const current = holdingsMap.get(t.assetCode) || 0;
      holdingsMap.set(
        t.assetCode,
        t.action === 'MUA' ? current + t.quantity : current - t.quantity,
      );
    });

    const validRows: {
      date: Date;
      assetType: string;
      assetCode: string;
      action: string;
      quantity: number;
      unitPrice: number;
      currency: string;
      note: string | null;
      icon: string;
      iconBg: string;
    }[] = [];
    const importErrors: CsvParseError[] = [...errors];

    for (let i = 0; i < parsed.length; i++) {
      const row = parsed[i];
      const rowNum = i + 2; // header + 1-based

      const asset = assetMap.get(row.assetCode);
      if (!asset) {
        importErrors.push({ row: rowNum, message: `Asset ${row.assetCode} not registered` });
        continue;
      }

      if (row.action === 'BAN') {
        const holding = holdingsMap.get(row.assetCode) || 0;
        if (row.quantity > holding) {
          importErrors.push({
            row: rowNum,
            message: `Insufficient holdings for ${row.assetCode}. Available: ${holding}, requested: ${row.quantity}`,
          });
          continue;
        }
        holdingsMap.set(row.assetCode, holding - row.quantity);
      } else {
        const holding = holdingsMap.get(row.assetCode) || 0;
        holdingsMap.set(row.assetCode, holding + row.quantity);
      }

      validRows.push({
        date: new Date(row.date),
        assetType: row.assetType,
        assetCode: row.assetCode,
        action: row.action,
        quantity: row.quantity,
        unitPrice: row.unitPrice,
        currency: asset.currency,
        note: row.note || null,
        icon: row.icon || asset.icon,
        iconBg: row.iconBg || asset.iconBg,
      });
    }

    if (validRows.length > 0) {
      await this.prisma.transaction.createMany({
        data: validRows.map((r) => ({ userId, ...r })),
      });
    }

    return {
      successCount: validRows.length,
      errorCount: importErrors.length,
      errors: importErrors,
    };
  }
}
