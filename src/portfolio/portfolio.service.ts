import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CurrenciesService } from '../currencies/currencies.service.js';
import { getPeriodStartDate, toDateStr, roundByCurrency } from '../common/helpers/period.helper.js';

@Injectable()
export class PortfolioService {
  constructor(
    private prisma: PrismaService,
    private currenciesService: CurrenciesService,
  ) {}

  private async getAssetCurrencyMap(userId: string): Promise<Map<string, string>> {
    const assets = await this.prisma.asset.findMany({
      where: { userId },
      select: { code: true, currency: true },
    });
    const map = new Map<string, string>();
    assets.forEach((a) => map.set(a.code, a.currency));
    return map;
  }

  private getRate(
    code: string,
    assetCurrencyMap: Map<string, string>,
    rateMap: Map<string, number>,
  ): number {
    const currency = assetCurrencyMap.get(code) || 'VND';
    return rateMap.get(currency) || 1;
  }

  async getSummary(userId: string) {
    const [transactions, prices, assetCurrencyMap, rateMap] = await Promise.all([
      this.prisma.transaction.findMany({ where: { userId } }),
      this.prisma.price.findMany({ where: { userId } }),
      this.getAssetCurrencyMap(userId),
      this.currenciesService.getRateMap(userId),
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
        const rate = this.getRate(code, assetCurrencyMap, rateMap);
        totalValue += h.quantity * currentPrice * rate;
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
        const rate = this.getRate(code, assetCurrencyMap, rateMap);
        capitalInvested += h.quantity * avgCost * rate;
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
    const [transactions, prices, assetCurrencyMap, rateMap] = await Promise.all([
      this.prisma.transaction.findMany({ where: { userId } }),
      this.prisma.price.findMany({ where: { userId } }),
      this.getAssetCurrencyMap(userId),
      this.currenciesService.getRateMap(userId),
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
      const rate = this.getRate(code, assetCurrencyMap, rateMap);
      const currency = assetCurrencyMap.get(code) || 'VND';
      const valueVnd = a.netQty * currentPrice * rate;
      const profitLossAmount = (currentPrice - avgCost) * a.netQty * rate;
      const profitLossPercent =
        avgCost > 0 ? Math.round(((currentPrice - avgCost) / avgCost) * 10000) / 100 : 0;

      result.push({
        assetCode: code,
        assetType: a.assetType,
        name: code,
        icon: priceInfo?.icon || a.icon,
        iconBg: a.iconBg,
        quantity: a.netQty,
        averageCost: roundByCurrency(avgCost, currency),
        currentPrice: roundByCurrency(currentPrice, currency),
        currency,
        value: Math.round(valueVnd),
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
      savings: 'Savings',
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
    const assetCurrencyMap = await this.getAssetCurrencyMap(userId);
    const rateMap = await this.currenciesService.getRateMap(userId);
    return holdings
      .map((h) => {
        const currency = h.currency || 'VND';
        const rate = this.getRate(h.assetCode, assetCurrencyMap, rateMap);
        const costNative = roundByCurrency(h.averageCost * h.quantity, currency);
        const valueNative = roundByCurrency(
          h.value / (rate || 1),
          currency,
        );
        return {
          symbol: h.assetCode,
          assetType: h.assetType,
          icon: h.icon,
          iconBg: h.iconBg,
          currency,
          costNative,
          valueNative,
          cost: Math.round(costNative * rate),
          value: h.value,
          profit: h.profitLossAmount,
          profitPercent: h.profitLossPercent,
          positive: h.positive,
        };
      })
      .sort((a, b) => b.profitPercent - a.profitPercent);
  }

  async getHistory(userId: string, period: string = '6m') {
    const startDate = getPeriodStartDate(period);

    const [transactions, prices, assetCurrencyMap, rateMap] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { userId },
        orderBy: { date: 'asc' },
      }),
      this.prisma.price.findMany({ where: { userId } }),
      this.getAssetCurrencyMap(userId),
      this.currenciesService.getRateMap(userId),
    ]);

    const priceMap = new Map<string, number>();
    prices.forEach((p) => priceMap.set(p.code, p.price));

    if (transactions.length === 0) {
      return { period, points: [] };
    }

    const firstTxDate = transactions[0].date;
    const today = new Date();
    const windowStart = startDate && startDate > firstTxDate ? startDate : firstTxDate;

    const pointDates: Date[] = [];
    // Start from the end of the month preceding windowStart so the first emitted
    // point is the end-of-month of windowStart itself.
    const cursor = new Date(
      windowStart.getFullYear(),
      windowStart.getMonth() + 1,
      0,
    );
    while (cursor < today) {
      pointDates.push(new Date(cursor));
      cursor.setMonth(cursor.getMonth() + 2, 0);
    }
    const todayStr = toDateStr(today);
    if (
      pointDates.length === 0 ||
      toDateStr(pointDates[pointDates.length - 1]) !== todayStr
    ) {
      pointDates.push(today);
    }

    const runningHoldings = new Map<string, { qty: number; cost: number }>();
    let txIndex = 0;
    const points: {
      date: string;
      value: number;
      cost: number;
      profit: number;
      profitPercentage: number;
    }[] = [];

    for (const pd of pointDates) {
      while (
        txIndex < transactions.length &&
        transactions[txIndex].date <= pd
      ) {
        const t = transactions[txIndex];
        const code = t.assetCode;
        if (!runningHoldings.has(code)) {
          runningHoldings.set(code, { qty: 0, cost: 0 });
        }
        const h = runningHoldings.get(code)!;
        if (t.action === 'MUA') {
          h.qty += t.quantity;
          h.cost += t.quantity * t.unitPrice;
        } else {
          const avgCost = h.qty > 0 ? h.cost / h.qty : 0;
          h.cost -= t.quantity * avgCost;
          h.qty -= t.quantity;
          if (h.qty <= 0) {
            h.qty = 0;
            h.cost = 0;
          }
        }
        txIndex++;
      }

      let totalValue = 0;
      let totalCost = 0;
      runningHoldings.forEach((h, code) => {
        if (h.qty > 0) {
          const price = priceMap.get(code) || 0;
          const rate = this.getRate(code, assetCurrencyMap, rateMap);
          totalValue += h.qty * price * rate;
          totalCost += h.cost * rate;
        }
      });

      const profit = totalValue - totalCost;
      const profitPercentage =
        totalCost > 0 ? Math.round((profit / totalCost) * 10000) / 100 : 0;

      points.push({
        date: toDateStr(pd),
        value: Math.round(totalValue),
        cost: Math.round(totalCost),
        profit: Math.round(profit),
        profitPercentage,
      });
    }

    return { period, points };
  }
}
