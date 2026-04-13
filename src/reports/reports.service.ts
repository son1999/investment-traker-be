import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CurrenciesService } from '../currencies/currencies.service.js';
import { getPeriodStartDate, toDateStr, getMonthKey, roundByCurrency } from '../common/helpers/period.helper.js';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private currenciesService: CurrenciesService,
  ) {}

  private async getFilteredTransactions(userId: string, period: string) {
    const startDate = getPeriodStartDate(period);

    const where: any = { userId };
    if (startDate) where.date = { gte: startDate };

    return this.prisma.transaction.findMany({
      where,
      orderBy: { date: 'asc' },
    });
  }

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

  async getPerformance(userId: string, period: string = 'all') {
    const [transactions, prices, assetCurrencyMap, rateMap] = await Promise.all([
      this.getFilteredTransactions(userId, period),
      this.prisma.price.findMany({ where: { userId } }),
      this.getAssetCurrencyMap(userId),
      this.currenciesService.getRateMap(userId),
    ]);

    const priceMap = new Map<string, number>();
    prices.forEach((p) => priceMap.set(p.code, p.price));

    const monthlyHoldings = new Map<string, boolean>();
    const runningHoldings = new Map<string, { qty: number; type: string }>();

    transactions.forEach((t) => {
      const monthKey = getMonthKey(t.date);
      const code = t.assetCode;

      if (!runningHoldings.has(code)) {
        runningHoldings.set(code, { qty: 0, type: t.assetType });
      }
      const h = runningHoldings.get(code)!;
      if (t.action === 'MUA') {
        h.qty += t.quantity;
      } else {
        h.qty -= t.quantity;
      }

      monthlyHoldings.set(monthKey, true);
    });

    const sortedMonthKeys = Array.from(monthlyHoldings.keys()).sort();
    const series: Record<string, number[]> = { metal: [], crypto: [], stock: [], savings: [] };
    const monthLabels: string[] = [];

    const cumulativeHoldings = new Map<string, { qty: number; type: string }>();

    let txIdx = 0;
    for (const monthKey of sortedMonthKeys) {
      while (txIdx < transactions.length && getMonthKey(transactions[txIdx].date) <= monthKey) {
        const t = transactions[txIdx];
        const code = t.assetCode;
        if (!cumulativeHoldings.has(code)) {
          cumulativeHoldings.set(code, { qty: 0, type: t.assetType });
        }
        const h = cumulativeHoldings.get(code)!;
        if (t.action === 'MUA') h.qty += t.quantity;
        else h.qty -= t.quantity;
        txIdx++;
      }

      const typeValues: Record<string, number> = { metal: 0, crypto: 0, stock: 0, savings: 0 };
      cumulativeHoldings.forEach((h, code) => {
        if (h.qty > 0) {
          const price = priceMap.get(code) || 0;
          const rate = this.getRate(code, assetCurrencyMap, rateMap);
          typeValues[h.type] = (typeValues[h.type] || 0) + h.qty * price * rate;
        }
      });

      const label = new Date(monthKey + '-15').toLocaleDateString('en-US', { month: 'short' });
      monthLabels.push(label);
      series.metal.push(Math.round(typeValues.metal));
      series.crypto.push(Math.round(typeValues.crypto));
      series.stock.push(Math.round(typeValues.stock));
      series.savings.push(Math.round(typeValues.savings));
    }

    return { months: monthLabels, series };
  }

  async getSummary(userId: string, period: string = 'all') {
    const [transactions, prices, assetCurrencyMap, rateMap] = await Promise.all([
      this.getFilteredTransactions(userId, period),
      this.prisma.price.findMany({ where: { userId } }),
      this.getAssetCurrencyMap(userId),
      this.currenciesService.getRateMap(userId),
    ]);

    const priceMap = new Map<string, number>();
    prices.forEach((p) => priceMap.set(p.code, p.price));

    let totalDeposited = 0;
    let totalWithdrawn = 0;
    let realizedPnl = 0;

    const buyLots = new Map<string, { qty: number; price: number }[]>();

    transactions.forEach((t) => {
      const code = t.assetCode;
      const qty = t.quantity;
      const price = t.unitPrice;
      const rate = this.getRate(code, assetCurrencyMap, rateMap);

      if (t.action === 'MUA') {
        totalDeposited += qty * price * rate;
        if (!buyLots.has(code)) buyLots.set(code, []);
        buyLots.get(code)!.push({ qty, price });
      } else {
        totalWithdrawn += qty * price * rate;
        let remaining = qty;
        const lots = buyLots.get(code) || [];
        while (remaining > 0 && lots.length > 0) {
          const lot = lots[0];
          const used = Math.min(remaining, lot.qty);
          realizedPnl += (price - lot.price) * used * rate;
          lot.qty -= used;
          remaining -= used;
          if (lot.qty <= 0) lots.shift();
        }
      }
    });

    let unrealizedPnl = 0;
    buyLots.forEach((lots, code) => {
      const currentPrice = priceMap.get(code) || 0;
      const rate = this.getRate(code, assetCurrencyMap, rateMap);
      lots.forEach((lot) => {
        if (lot.qty > 0) {
          unrealizedPnl += (currentPrice - lot.price) * lot.qty * rate;
        }
      });
    });

    return {
      totalDeposited: Math.round(totalDeposited),
      totalWithdrawn: Math.round(totalWithdrawn),
      realizedPnl: Math.round(realizedPnl),
      unrealizedPnl: Math.round(unrealizedPnl),
    };
  }

  async getCashFlow(userId: string, period: string = 'all') {
    const [transactions, assetCurrencyMap, rateMap] = await Promise.all([
      this.getFilteredTransactions(userId, period),
      this.getAssetCurrencyMap(userId),
      this.currenciesService.getRateMap(userId),
    ]);

    const monthlyFlow = new Map<string, { inflow: number; outflow: number }>();

    transactions.forEach((t) => {
      const month = getMonthKey(t.date);
      if (!monthlyFlow.has(month)) {
        monthlyFlow.set(month, { inflow: 0, outflow: 0 });
      }
      const flow = monthlyFlow.get(month)!;
      const rate = this.getRate(t.assetCode, assetCurrencyMap, rateMap);
      const total = t.quantity * t.unitPrice * rate;
      if (t.action === 'MUA') {
        flow.inflow += total;
      } else {
        flow.outflow += total;
      }
    });

    return Array.from(monthlyFlow.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, flow]) => ({
        month,
        inflow: Math.round(flow.inflow),
        outflow: Math.round(flow.outflow),
      }));
  }

  async getTopAssets(userId: string, period: string = 'all', limit: number = 5) {
    const [transactions, prices, assetCurrencyMap, rateMap] = await Promise.all([
      this.getFilteredTransactions(userId, period),
      this.prisma.price.findMany({ where: { userId } }),
      this.getAssetCurrencyMap(userId),
      this.currenciesService.getRateMap(userId),
    ]);

    const priceMap = new Map<string, { price: number; icon: string }>();
    prices.forEach((p) =>
      priceMap.set(p.code, { price: p.price, icon: p.icon }),
    );

    const assetMap = new Map<string, {
      totalBuyQty: number;
      totalBuyCost: number;
      netQty: number;
      icon: string;
      assetType: string;
    }>();

    transactions.forEach((t) => {
      const code = t.assetCode;
      if (!assetMap.has(code)) {
        assetMap.set(code, { totalBuyQty: 0, totalBuyCost: 0, netQty: 0, icon: t.icon, assetType: t.assetType });
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

    let totalPortfolioValue = 0;
    const assets: any[] = [];

    assetMap.forEach((a, code) => {
      if (a.netQty <= 0) return;
      const priceInfo = priceMap.get(code);
      const currentPrice = priceInfo?.price || 0;
      const rate = this.getRate(code, assetCurrencyMap, rateMap);
      const currentValue = a.netQty * currentPrice * rate;
      const avgCost = a.totalBuyQty > 0 ? a.totalBuyCost / a.totalBuyQty : 0;
      const invested = a.netQty * avgCost * rate;
      const pnlAmount = currentValue - invested;
      const pnlPercent = invested > 0 ? Math.round(((currentValue - invested) / invested) * 10000) / 100 : 0;

      totalPortfolioValue += currentValue;
      assets.push({
        assetCode: code,
        assetType: a.assetType,
        name: code,
        icon: priceInfo?.icon || a.icon,
        invested: Math.round(invested),
        currentValue: Math.round(currentValue),
        profitLossPercent: pnlPercent,
        profitLossAmount: Math.round(pnlAmount),
        positive: pnlAmount >= 0,
        value: currentValue,
      });
    });

    return assets
      .sort((a, b) => b.value - a.value)
      .slice(0, limit)
      .map((a, idx) => ({
        rank: idx + 1,
        assetCode: a.assetCode,
        assetType: a.assetType,
        name: a.name,
        icon: a.icon,
        invested: a.invested,
        currentValue: a.currentValue,
        profitLossPercent: a.profitLossPercent,
        profitLossAmount: a.profitLossAmount,
        positive: a.positive,
        weight: totalPortfolioValue > 0 ? Math.round((a.value / totalPortfolioValue) * 10000) / 100 : 0,
      }));
  }

  async getPerformanceComparison(userId: string) {
    const [transactions, prices, assetCurrencyMap, rateMap] = await Promise.all([
      this.prisma.transaction.findMany({ where: { userId } }),
      this.prisma.price.findMany({ where: { userId } }),
      this.getAssetCurrencyMap(userId),
      this.currenciesService.getRateMap(userId),
    ]);

    const priceMap = new Map<string, number>();
    prices.forEach((p) => priceMap.set(p.code, p.price));

    const assetMap = new Map<string, { totalBuyQty: number; totalBuyCost: number; netQty: number }>();

    transactions.forEach((t) => {
      const code = t.assetCode;
      if (!assetMap.has(code)) {
        assetMap.set(code, { totalBuyQty: 0, totalBuyCost: 0, netQty: 0 });
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
      const currentPrice = priceMap.get(code) || 0;
      const avgCost = a.totalBuyQty > 0 ? a.totalBuyCost / a.totalBuyQty : 0;
      const rate = this.getRate(code, assetCurrencyMap, rateMap);
      const invested = a.netQty * avgCost * rate;
      const currentValue = a.netQty * currentPrice * rate;
      const profitPercent = invested > 0 ? Math.round(((currentValue - invested) / invested) * 10000) / 100 : 0;

      result.push({
        name: code,
        assetCode: code,
        invested: Math.round(invested),
        currentValue: Math.round(currentValue),
        profitPercent,
        positive: currentValue >= invested,
      });
    });

    return result;
  }

  async getDcaChart(userId: string, code: string) {
    const [buyTxs, priceData, assetCurrencyMap] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { userId, assetCode: code, action: 'MUA' },
        orderBy: { date: 'asc' },
      }),
      this.prisma.price.findMany({
        where: { userId, code },
        take: 1,
      }),
      this.getAssetCurrencyMap(userId),
    ]);

    const cur =
      assetCurrencyMap.get(code) ||
      priceData[0]?.currency ||
      buyTxs[0]?.currency ||
      'VND';
    const r = (v: number) => roundByCurrency(v, cur);
    const currentPrice = priceData.length > 0 ? priceData[0].price : 0;

    if (buyTxs.length === 0) {
      return {
        assetCode: code,
        currency: cur,
        numPurchases: 0,
        avgIntervalDays: 0,
        avgPerPurchase: 0,
        purchaseAmounts: [],
        purchaseDates: [],
        purchaseUnitPrices: [],
        avgCostPrices: [],
        currentPrice,
      };
    }

    const purchaseAmounts: number[] = [];
    const purchaseDates: string[] = [];
    const purchaseUnitPrices: number[] = [];
    const avgCostPrices: number[] = [];
    let runningQty = 0;
    let runningCost = 0;
    let totalInterval = 0;

    buyTxs.forEach((t, i) => {
      const qty = t.quantity;
      const price = t.unitPrice;
      runningQty += qty;
      runningCost += qty * price;
      purchaseAmounts.push(r(qty * price));
      purchaseDates.push(toDateStr(t.date));
      purchaseUnitPrices.push(r(price));
      avgCostPrices.push(r(runningCost / runningQty));

      if (i > 0) {
        const prev = buyTxs[i - 1].date.getTime();
        const curr = t.date.getTime();
        totalInterval += (curr - prev) / (1000 * 60 * 60 * 24);
      }
    });

    const totalPurchaseAmount = purchaseAmounts.reduce((a, b) => a + b, 0);

    return {
      assetCode: code,
      currency: cur,
      numPurchases: buyTxs.length,
      avgIntervalDays: buyTxs.length > 1 ? Math.round(totalInterval / (buyTxs.length - 1)) : 0,
      avgPerPurchase: r(totalPurchaseAmount / buyTxs.length),
      purchaseAmounts,
      purchaseDates,
      purchaseUnitPrices,
      avgCostPrices,
      currentPrice,
    };
  }

  async getDcaHistory(userId: string, code: string) {
    const [buyTxs, asset] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where: { userId, assetCode: code, action: 'MUA' },
        orderBy: { date: 'asc' },
      }),
      this.prisma.asset.findUnique({
        where: { userId_code: { userId, code } },
        select: { currency: true },
      }),
    ]);

    const cur = asset?.currency || buyTxs[0]?.currency || 'VND';

    return buyTxs.map((t, i) => ({
      number: i + 1,
      date: toDateStr(t.date),
      unitPrice: roundByCurrency(t.unitPrice, cur),
      quantity: t.quantity,
      total: roundByCurrency(t.quantity * t.unitPrice, cur),
    }));
  }

  async getDcaComparison(userId: string, code: string) {
    const [buyTxs, priceData, asset] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where: { userId, assetCode: code, action: 'MUA' },
        orderBy: { date: 'asc' },
      }),
      this.prisma.price.findMany({
        where: { userId, code },
        take: 1,
      }),
      this.prisma.asset.findUnique({
        where: { userId_code: { userId, code } },
        select: { currency: true },
      }),
    ]);

    const cur = asset?.currency || buyTxs[0]?.currency || 'VND';
    const r = (v: number) => roundByCurrency(v, cur);
    const currentPrice = priceData.length > 0 ? priceData[0].price : 0;

    if (buyTxs.length === 0) {
      return {
        dca: { avgCost: 0, totalCapital: 0, currentValue: 0, profit: 0, profitPercent: 0 },
        lumpSum: { priceAtFirstBuy: 0, totalCapital: 0, currentValue: 0, profit: 0, profitPercent: 0 },
      };
    }

    let totalQty = 0;
    let totalCost = 0;
    buyTxs.forEach((t) => {
      totalQty += t.quantity;
      totalCost += t.quantity * t.unitPrice;
    });
    const avgCost = totalQty > 0 ? r(totalCost / totalQty) : 0;
    const dcaCurrentValue = r(totalQty * currentPrice);
    const dcaTotalCost = r(totalCost);
    const dcaProfit = r(dcaCurrentValue - dcaTotalCost);
    const dcaProfitPercent = totalCost > 0 ? Math.round((dcaProfit / dcaTotalCost) * 10000) / 100 : 0;

    const priceAtFirstBuy = buyTxs[0].unitPrice;
    const lumpSumQty = priceAtFirstBuy > 0 ? totalCost / priceAtFirstBuy : 0;
    const lumpSumCurrentValue = r(lumpSumQty * currentPrice);
    const lumpSumProfit = r(lumpSumCurrentValue - dcaTotalCost);
    const lumpSumProfitPercent = totalCost > 0 ? Math.round((lumpSumProfit / dcaTotalCost) * 10000) / 100 : 0;

    return {
      dca: {
        avgCost,
        totalCapital: dcaTotalCost,
        currentValue: dcaCurrentValue,
        profit: dcaProfit,
        profitPercent: dcaProfitPercent,
      },
      lumpSum: {
        priceAtFirstBuy,
        totalCapital: dcaTotalCost,
        currentValue: lumpSumCurrentValue,
        profit: lumpSumProfit,
        profitPercent: lumpSumProfitPercent,
      },
    };
  }
}
