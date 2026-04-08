import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { I18nService } from '../i18n/i18n.service.js';
import { CreateAssetDto } from './dto/create-asset.dto.js';
import { UpdateAssetDto } from './dto/update-asset.dto.js';
import { getPeriodStartDate, toDateStr } from '../common/helpers/period.helper.js';

@Injectable()
export class AssetsService {
  constructor(
    private prisma: PrismaService,
    private i18n: I18nService,
  ) {}

  // ─── CRUD ──────────────────────────────────────────────

  async findAll(userId: string, type?: string) {
    const where: any = { userId };
    if (type) where.type = type;

    return this.prisma.asset.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, code: string) {
    const asset = await this.prisma.asset.findUnique({
      where: { userId_code: { userId, code } },
    });
    if (!asset) {
      throw new NotFoundException(this.i18n.t('ASSET_NOT_FOUND', { code }));
    }
    return asset;
  }

  async create(userId: string, dto: CreateAssetDto) {
    const existing = await this.prisma.asset.findUnique({
      where: { userId_code: { userId, code: dto.code } },
    });
    if (existing) {
      throw new ConflictException(this.i18n.t('ASSET_ALREADY_EXISTS', { code: dto.code }));
    }

    const currency = dto.currency || 'VND';
    if (currency !== 'VND') {
      const currencyExists = await this.prisma.currency.findUnique({
        where: { userId_code: { userId, code: currency } },
      });
      if (!currencyExists) {
        throw new BadRequestException(this.i18n.t('CURRENCY_NOT_FOUND', { code: currency }));
      }
    }

    return this.prisma.asset.create({
      data: {
        userId,
        code: dto.code,
        name: dto.name,
        type: dto.type,
        currency,
        icon: dto.icon,
        iconBg: dto.iconBg,
      },
    });
  }

  async update(userId: string, code: string, dto: UpdateAssetDto) {
    const existing = await this.prisma.asset.findUnique({
      where: { userId_code: { userId, code } },
    });
    if (!existing) {
      throw new NotFoundException(this.i18n.t('ASSET_NOT_FOUND', { code }));
    }

    return this.prisma.asset.update({
      where: { id: existing.id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
        ...(dto.iconBg !== undefined && { iconBg: dto.iconBg }),
      },
    });
  }

  async delete(userId: string, code: string) {
    const existing = await this.prisma.asset.findUnique({
      where: { userId_code: { userId, code } },
    });
    if (!existing) {
      throw new NotFoundException(this.i18n.t('ASSET_NOT_FOUND', { code }));
    }

    const txCount = await this.prisma.transaction.count({
      where: { userId, assetCode: code },
    });
    if (txCount > 0) {
      throw new BadRequestException(this.i18n.t('ASSET_HAS_TRANSACTIONS', { code, count: txCount }));
    }

    await this.prisma.asset.delete({ where: { id: existing.id } });
    return { success: true };
  }

  // ─── DETAIL & TRANSACTIONS (existing) ─────────────────

  async getAssetDetail(userId: string, code: string) {
    const transactions = await this.prisma.transaction.findMany({
      where: { userId, assetCode: code },
      orderBy: { date: 'asc' },
    });

    if (transactions.length === 0) {
      throw new NotFoundException(this.i18n.t('ASSET_NOT_FOUND', { code }));
    }

    const priceData = await this.prisma.price.findUnique({
      where: { userId_code: { userId, code } },
    });

    const asset = await this.prisma.asset.findUnique({
      where: { userId_code: { userId, code } },
    });

    const currentPrice = priceData ? priceData.price : 0;
    const assetType = asset?.type || transactions[0].assetType;
    const icon = asset?.icon || priceData?.icon || transactions[0].icon;
    const iconBg = asset?.iconBg || transactions[0].iconBg;

    const buyLots: { qty: number; price: number }[] = [];
    let totalBuyQty = 0;
    let totalBuyCost = 0;
    let netQty = 0;
    let buyCount = 0;
    let sellCount = 0;
    const realizedTransactions: any[] = [];

    transactions.forEach((t) => {
      const qty = t.quantity;
      const price = t.unitPrice;

      if (t.action === 'MUA') {
        buyLots.push({ qty, price });
        totalBuyQty += qty;
        totalBuyCost += qty * price;
        netQty += qty;
        buyCount++;
      } else {
        netQty -= qty;
        sellCount++;
        let remaining = qty;
        let sellProfit = 0;
        while (remaining > 0 && buyLots.length > 0) {
          const lot = buyLots[0];
          const used = Math.min(remaining, lot.qty);
          sellProfit += (price - lot.price) * used;
          lot.qty -= used;
          remaining -= used;
          if (lot.qty <= 0) buyLots.shift();
        }
        realizedTransactions.push({
          date: toDateStr(t.date),
          quantity: qty,
          sellPrice: price,
          profit: Math.round(sellProfit),
        });
      }
    });

    const avgCost = totalBuyQty > 0 ? Math.round(totalBuyCost / totalBuyQty) : 0;
    const totalRealizedPnl = realizedTransactions.reduce((sum: number, rt: any) => sum + rt.profit, 0);

    let unrealizedTotal = 0;
    let remainingCost = 0;
    buyLots.forEach((lot) => {
      unrealizedTotal += (currentPrice - lot.price) * lot.qty;
      remainingCost += lot.price * lot.qty;
    });

    const currentValue = netQty * currentPrice;
    const profitAmount = unrealizedTotal;
    const profitPercent = remainingCost > 0 ? Math.round((unrealizedTotal / remainingCost) * 10000) / 100 : 0;

    let runningQty = 0;
    const valueHistory: { date: string; value: number }[] = [];
    transactions.forEach((t) => {
      if (t.action === 'MUA') runningQty += t.quantity;
      else runningQty -= t.quantity;
      valueHistory.push({
        date: toDateStr(t.date),
        value: Math.round(runningQty * currentPrice),
      });
    });

    return {
      assetCode: code,
      assetType,
      icon,
      iconBg,
      metrics: {
        holdings: {
          quantity: netQty,
          unit: code,
          detail: this.i18n.t('HOLDINGS_DETAIL', { buyCount, sellCount }),
        },
        avgCost: {
          value: avgCost,
          currency: 'VND',
        },
        currentPrice: {
          value: currentPrice,
          currency: 'VND',
          updatedAt: priceData?.updatedAt || null,
        },
        profit: {
          amount: Math.round(profitAmount),
          percent: profitPercent,
          positive: profitAmount >= 0,
        },
      },
      realizedPnl: {
        total: Math.round(totalRealizedPnl),
        transactions: realizedTransactions,
      },
      unrealizedPnl: {
        total: Math.round(unrealizedTotal),
        currentValue: Math.round(currentValue),
        totalCost: Math.round(remainingCost),
      },
      valueHistory,
    };
  }

  async getAssetTransactions(
    userId: string,
    code: string,
    period: string = '1y',
    page: number = 1,
    limit: number = 20,
  ) {
    const startDate = getPeriodStartDate(period);

    const where: any = { userId, assetCode: code };
    if (startDate) where.date = { gte: startDate };

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
      data: data.map((t) => ({
        id: t.id,
        date: toDateStr(t.date),
        action: t.action,
        quantity: t.quantity,
        unitPrice: t.unitPrice,
        total: Math.round(t.quantity * t.unitPrice),
        note: t.note,
      })),
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }
}
