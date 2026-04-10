import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { I18nService } from '../i18n/i18n.service.js';
import { CreateAssetDto } from './dto/create-asset.dto.js';
import { UpdateAssetDto } from './dto/update-asset.dto.js';
import { QueryAssetTransactionsDto } from './dto/query-asset-transactions.dto.js';
import { getPeriodStartDate, toDateStr, roundByCurrency } from '../common/helpers/period.helper.js';

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
        ...(dto.type === 'savings' && {
          interestRate: dto.interestRate,
          termMonths: dto.termMonths,
          bankName: dto.bankName || null,
          maturityDate: dto.maturityDate ? new Date(dto.maturityDate) : null,
        }),
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
        ...(dto.interestRate !== undefined && { interestRate: dto.interestRate }),
        ...(dto.termMonths !== undefined && { termMonths: dto.termMonths }),
        ...(dto.bankName !== undefined && { bankName: dto.bankName }),
        ...(dto.maturityDate !== undefined && { maturityDate: new Date(dto.maturityDate) }),
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
    const currency = asset?.currency || transactions[0]?.currency || 'VND';

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
          profit: roundByCurrency(sellProfit, currency),
        });
      }
    });

    const avgCost = totalBuyQty > 0 ? roundByCurrency(totalBuyCost / totalBuyQty, currency) : 0;
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
    let lastKnownPrice = 0;
    const valueHistory: { date: string; value: number }[] = [];
    transactions.forEach((t) => {
      if (t.action === 'MUA') runningQty += t.quantity;
      else runningQty -= t.quantity;
      lastKnownPrice = t.unitPrice;
      valueHistory.push({
        date: toDateStr(t.date),
        value: roundByCurrency(runningQty * lastKnownPrice, currency),
      });
    });

    const today = toDateStr(new Date());
    const lastEntry = valueHistory[valueHistory.length - 1];
    if (currentPrice > 0 && lastEntry && lastEntry.date !== today && netQty > 0) {
      valueHistory.push({ date: today, value: roundByCurrency(netQty * currentPrice, currency) });
    }

    return {
      assetCode: code,
      assetType,
      currency,
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
          currency,
        },
        currentPrice: {
          value: currentPrice,
          currency,
          updatedAt: priceData?.updatedAt || null,
        },
        profit: {
          amount: roundByCurrency(profitAmount, currency),
          percent: profitPercent,
          positive: profitAmount >= 0,
        },
      },
      realizedPnl: {
        total: roundByCurrency(totalRealizedPnl, currency),
        transactions: realizedTransactions,
      },
      unrealizedPnl: {
        total: roundByCurrency(unrealizedTotal, currency),
        currentValue: roundByCurrency(currentValue, currency),
        totalCost: roundByCurrency(remainingCost, currency),
      },
      valueHistory,
    };
  }

  async getAssetTransactions(
    userId: string,
    code: string,
    query: QueryAssetTransactionsDto,
  ) {
    const { period = '1y', action, fromDate, toDate, minPrice, maxPrice, page = 1, limit = 20 } = query;

    const where: any = { userId, assetCode: code };

    if (fromDate || toDate) {
      where.date = {};
      if (fromDate) where.date.gte = new Date(fromDate);
      if (toDate) where.date.lte = new Date(toDate);
    } else {
      const startDate = getPeriodStartDate(period);
      if (startDate) where.date = { gte: startDate };
    }

    if (action) where.action = action;

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.unitPrice = {};
      if (minPrice !== undefined) where.unitPrice.gte = minPrice;
      if (maxPrice !== undefined) where.unitPrice.lte = maxPrice;
    }

    const [data, total, asset] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
      this.prisma.asset.findUnique({
        where: { userId_code: { userId, code } },
        select: { currency: true },
      }),
    ]);

    const cur = asset?.currency || data[0]?.currency || 'VND';

    return {
      data: data.map((t) => ({
        id: t.id,
        date: toDateStr(t.date),
        action: t.action,
        quantity: t.quantity,
        unitPrice: roundByCurrency(t.unitPrice, cur),
        total: roundByCurrency(t.quantity * t.unitPrice, cur),
        currency: cur,
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
