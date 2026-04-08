import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { I18nService } from '../i18n/i18n.service.js';
import { CreateCurrencyDto } from './dto/create-currency.dto.js';
import { UpdateCurrencyDto } from './dto/update-currency.dto.js';

@Injectable()
export class CurrenciesService {
  constructor(
    private prisma: PrismaService,
    private i18n: I18nService,
  ) {}

  async findAll(userId: string) {
    return this.prisma.currency.findMany({
      where: { userId },
      orderBy: { code: 'asc' },
    });
  }

  async create(userId: string, dto: CreateCurrencyDto) {
    const existing = await this.prisma.currency.findUnique({
      where: { userId_code: { userId, code: dto.code } },
    });
    if (existing) {
      throw new ConflictException(this.i18n.t('CURRENCY_ALREADY_EXISTS', { code: dto.code }));
    }

    return this.prisma.currency.create({
      data: {
        userId,
        code: dto.code,
        name: dto.name,
        symbol: dto.symbol,
        rateToVnd: dto.rateToVnd,
      },
    });
  }

  async update(userId: string, code: string, dto: UpdateCurrencyDto) {
    const existing = await this.prisma.currency.findUnique({
      where: { userId_code: { userId, code } },
    });
    if (!existing) {
      throw new NotFoundException(this.i18n.t('CURRENCY_NOT_FOUND', { code }));
    }

    return this.prisma.currency.update({
      where: { id: existing.id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.symbol !== undefined && { symbol: dto.symbol }),
        ...(dto.rateToVnd !== undefined && { rateToVnd: dto.rateToVnd }),
      },
    });
  }

  async delete(userId: string, code: string) {
    const existing = await this.prisma.currency.findUnique({
      where: { userId_code: { userId, code } },
    });
    if (!existing) {
      throw new NotFoundException(this.i18n.t('CURRENCY_NOT_FOUND', { code }));
    }

    // Check if any assets use this currency
    const assetCount = await this.prisma.asset.count({
      where: { userId, currency: code },
    });
    if (assetCount > 0) {
      throw new ConflictException(this.i18n.t('CURRENCY_IN_USE', { code, count: assetCount }));
    }

    await this.prisma.currency.delete({ where: { id: existing.id } });
    return { success: true };
  }

  async getRateMap(userId: string): Promise<Map<string, number>> {
    const currencies = await this.prisma.currency.findMany({ where: { userId } });
    const map = new Map<string, number>();
    map.set('VND', 1);
    currencies.forEach((c) => map.set(c.code, c.rateToVnd));
    return map;
  }
}
