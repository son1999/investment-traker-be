import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { getPeriodStartDate, toDateStr, getMonthKey } from '../common/helpers/period.helper.js';

@Injectable()
export class PortfolioService {
  constructor(private prisma: PrismaService) {}

  async getSummary(userId: string) {
    const [transactions, prices] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({ where: { userId } }),
      this.prisma.price.findMany({ where: { userId } }),
    ]);

    const priceMap = new Map<string, number>();
    prices.forEach((p) => priceMap.set(p.code, p.price));

    const holdings = new Map<string, { quantity: number; totalCost: number }>();
    let buyOrdersCount = 0;

    transactions.forEach((t) => {
      const code = t.assetCode;
      if (!holdings.has(code)) {
        holdings.set(code, { quantity: 0, totalCost: 0 });
      }
      const h = holdings.get(code)!;
      if (t.action === 'MUA') {
        h.totalCost += t.quantity * t.unitPrice;
        h.quantity += t.quantity;
        buyOrdersCount++;
      } else {
        h.quantity -= t.quantity;
      }
    });

    let totalValue = 0;
    const assetCodes: string[] = [];

    holdings.forEach((h, code) => {
      if (h.quantity > 0) {
        const currentPrice = priceMap.get(code) || 0;
        totalValue += h.quantity * currentPrice;
        assetCodes.push(code);
      }
    });

    let capitalInvested = 0;
    holdings.forEach((h, code) => {
      if (h.quantity > 0) {
        const buyTxs = transactions.filter(
          (t) => t.assetCode === code && t.action === 'MUA',
        );
        const totalBuyQty = buyTxs.reduce((sum, t) => sum + t.quantity, 0);
        const totalBuyCost = buyTxs.reduce(
          (sum, t) => sum + t.quantity * t.unitPrice,
          0,
        );
        const avgCost = totalBuyQty > 0 ? totalBuyCost / totalBuyQty : 0;
        capitalInvested += h.quantity * avgCost;
      }
    });

    const profit = totalValue - capitalInvested;
    const profitPercentage =
      capitalInvested > 0 ? Math.round((profit / capitalInvested) * 10000) / 100 : 0;

    return {
      totalValue: Math.round(totalValue),
      capitalInvested: Math.round(capitalInvested),
      profit: Math.round(profit),
      profitPercentage,
      assetsCount: assetCodes.length,
      buyOrdersCount,
      assetCodes,
    };
  }

  async getHoldings(userId: string) {
    const [transactions, prices] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({ where: { userId } }),
      this.prisma.price.findMany({ where: { userId } }),
    ]);

    const priceMap = new Map<string, { price: number; icon: string }>();
    prices.forEach((p) =>
      priceMap.set(p.code, { price: p.price, icon: p.icon }),
    );

    const assetMap = new Map<
      string,
      {
        assetType: string;
        icon: string;
        iconBg: string;
        totalBuyQty: number;
        totalBuyCost: number;
        netQty: number;
      }
    >();

    transactions.forEach((t) => {
      const code = t.assetCode;
      if (!assetMap.has(code)) {
        assetMap.set(code, {
          assetType: t.assetType,
          icon: t.icon,
          iconBg: t.iconBg,
          totalBuyQty: 0,
          totalBuyCost: 0,
          netQty: 0,
        });
      }
      const a = assetMap.get(code)!;
      if (t.action === 'MUA') {
        a.totalBuyQty += t.quantity;
        a.totalBuyCost += t.quantity * t.unitPrice;
        a.netQty += t.quantity;
      } else {
        a.netQty -= t.quantity;
      }
    });

    const result: any[] = [];
    assetMap.forEach((a, code) => {
      if (a.netQty <= 0) return;
      const avgCost = a.totalBuyQty > 0 ? a.totalBuyCost / a.totalBuyQty : 0;
      const priceInfo = priceMap.get(code);
      const currentPrice = priceInfo?.price || 0;
      const value = a.netQty * currentPrice;
      const profitLossAmount = (currentPrice - avgCost) * a.netQty;
      const profitLossPercent =
        avgCost > 0 ? Math.round(((currentPrice - avgCost) / avgCost) * 10000) / 100 : 0;

      result.push({
        assetCode: code,
        assetType: a.assetType,
        name: code,
        icon: priceInfo?.icon || a.icon,
        iconBg: a.iconBg,
        quantity: a.netQty,
        averageCost: Math.round(avgCost),
        currentPrice: Math.round(currentPrice),
        value: Math.round(value),
        profitLossPercent,
        profitLossAmount: Math.round(profitLossAmount),
        positive: profitLossAmount >= 0,
      });
    });

    return result;
  }

  async getAllocation(userId: string) {
    const holdings = await this.getHoldings(userId);
    const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);

    const typeMap = new Map<string, { amount: number }>();
    holdings.forEach((h) => {
      if (!typeMap.has(h.assetType)) {
        typeMap.set(h.assetType, { amount: 0 });
      }
      typeMap.get(h.assetType)!.amount += h.value;
    });

    const labelMap: Record<string, string> = {
      metal: 'Metal',
      crypto: 'Crypto',
      stock: 'Stock',
    };

    const result: any[] = [];
    typeMap.forEach((val, assetType) => {
      result.push({
        assetType,
        label: labelMap[assetType] || assetType,
        value: totalValue > 0 ? Math.round((val.amount / totalValue) * 10000) / 100 : 0,
        amount: Math.round(val.amount),
      });
    });

    return result;
  }

  async getProfitByAsset(userId: string) {
    const holdings = await this.getHoldings(userId);
    return holdings
      .map((h) => ({
        symbol: h.assetCode,
        profitPercent: h.profitLossPercent,
        positive: h.positive,
      }))
      .sort((a, b) => b.profitPercent - a.profitPercent);
  }

  async getHistory(userId: string, period: string = '6m') {
    const startDate = getPeriodStartDate(period);

    const where: any = { userId };
    if (startDate) where.date = { gte: startDate };

    const [transactions, prices] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where,
        orderBy: { date: 'asc' },
      }),
      this.prisma.price.findMany({ where: { userId } }),
    ]);

    const priceMap = new Map<string, number>();
    prices.forEach((p) => priceMap.set(p.code, p.price));

    if (transactions.length === 0) {
      return { period, points: [] };
    }

    const months = new Set<string>();
    transactions.forEach((t) => {
      months.add(getMonthKey(t.date) + '-01');
    });
    const today = toDateStr(new Date());
    months.add(today);

    const sortedMonths = Array.from(months).sort();
    const points: { date: string; value: number }[] = [];

    const runningHoldings = new Map<string, { qty: number }>();
    let txIndex = 0;

    for (const monthDate of sortedMonths) {
      while (txIndex < transactions.length && toDateStr(transactions[txIndex].date) <= monthDate) {
        const t = transactions[txIndex];
        const code = t.assetCode;
        if (!runningHoldings.has(code)) {
          runningHoldings.set(code, { qty: 0 });
        }
        const h = runningHoldings.get(code)!;
        if (t.action === 'MUA') {
          h.qty += t.quantity;
        } else {
          h.qty -= t.quantity;
        }
        txIndex++;
      }

      let totalValue = 0;
      runningHoldings.forEach((h, code) => {
        if (h.qty > 0) {
          const price = priceMap.get(code) || 0;
          totalValue += h.qty * price;
        }
      });

      points.push({ date: monthDate, value: Math.round(totalValue) });
    }

    return { period, points };
  }
}
