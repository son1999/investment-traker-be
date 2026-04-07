import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { getPeriodStartDate, toDateStr } from '../common/helpers/period.helper.js';

@Injectable()
export class AssetsService {
  constructor(private prisma: PrismaService) {}

  async getAssetDetail(userId: string, code: string) {
    const transactions = await this.prisma.transaction.findMany({
      where: { userId, assetCode: code },
      orderBy: { date: 'asc' },
    });

    if (transactions.length === 0) {
      throw new NotFoundException(`Asset ${code} not found`);
    }

    const priceData = await this.prisma.price.findUnique({
      where: { userId_code: { userId, code } },
    });

    const currentPrice = priceData ? priceData.price : 0;
    const assetType = transactions[0].assetType;
    const icon = priceData?.icon || transactions[0].icon;
    const iconBg = transactions[0].iconBg;

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
          detail: `${buyCount} lệnh mua · ${sellCount} lệnh bán`,
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
