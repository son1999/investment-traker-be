import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service.js';
import { CoinGeckoProvider } from './providers/coingecko.provider.js';
import { VnStockProvider } from './providers/vnstock.provider.js';
import { GoldProvider } from './providers/gold.provider.js';
import { isVietnamTradingHours } from './helpers/trading-hours.helper.js';

const CRYPTO_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const STOCK_TRADING_CACHE_TTL = 5 * 60 * 1000; // 5 min during trading hours
const STOCK_CLOSED_CACHE_TTL = 60 * 60 * 1000; // 1 hour outside trading hours

@Injectable()
export class PriceFetcherService {
  private readonly logger = new Logger(PriceFetcherService.name);

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private prisma: PrismaService,
    private coinGecko: CoinGeckoProvider,
    private vnStock: VnStockProvider,
    private gold: GoldProvider,
  ) {}

  async getCryptoPrice(code: string): Promise<number | null> {
    const cacheKey = `crypto:${code}`;
    const cached = await this.cacheManager.get<number>(cacheKey);
    if (cached !== undefined && cached !== null) return cached;

    const price = await this.coinGecko.fetchPrice(code, 'vnd');
    if (price !== null) {
      await this.cacheManager.set(cacheKey, price, CRYPTO_CACHE_TTL);
    }
    return price;
  }

  async getStockPrice(code: string): Promise<number | null> {
    const cacheKey = `stock:${code}`;
    const cached = await this.cacheManager.get<number>(cacheKey);
    if (cached !== undefined && cached !== null) return cached;

    const price = await this.vnStock.fetchStockPrice(code);
    if (price !== null) {
      const ttl = isVietnamTradingHours() ? STOCK_TRADING_CACHE_TTL : STOCK_CLOSED_CACHE_TTL;
      await this.cacheManager.set(cacheKey, price, ttl);
    }
    return price;
  }

  async getGoldPrice(code: string): Promise<number | null> {
    const cacheKey = `gold:${code}`;
    const cached = await this.cacheManager.get<number>(cacheKey);
    if (cached !== undefined && cached !== null) return cached;

    const price = await this.gold.fetchGoldPrice(code);
    if (price !== null) {
      await this.cacheManager.set(cacheKey, price, CRYPTO_CACHE_TTL); // 5 min cache
    }
    return price;
  }

  async getLivePrice(code: string, type: string): Promise<number | null> {
    switch (type) {
      case 'crypto':
        return this.getCryptoPrice(code);
      case 'stock':
        return this.getStockPrice(code);
      case 'metal':
        return this.getGoldPrice(code);
      default:
        return null; // savings: no auto-fetch
    }
  }

  async refreshAllPrices(userId: string) {
    const assets = await this.prisma.asset.findMany({
      where: { userId },
      select: { code: true, type: true, icon: true, currency: true },
    });

    const updates: { code: string; price: number; icon: string; type: string }[] = [];

    // Batch crypto prices via CoinGecko
    const cryptoAssets = assets.filter((a) => a.type === 'crypto');
    if (cryptoAssets.length > 0) {
      const coinIdMap = new Map<string, { assetCode: string; currency: string }>();
      const allCurrencies = new Set<string>();

      for (const asset of cryptoAssets) {
        const coinId = this.coinGecko.getCoinId(asset.code);
        if (coinId) {
          const cur = (asset.currency || 'VND').toLowerCase();
          // CoinGecko uses 'usd' for USDT as well
          const cgCurrency = cur === 'usdt' ? 'usd' : cur;
          coinIdMap.set(coinId, { assetCode: asset.code, currency: cgCurrency });
          allCurrencies.add(cgCurrency);
        }
      }

      if (coinIdMap.size > 0) {
        const prices = await this.coinGecko.fetchPrices(
          Array.from(coinIdMap.keys()),
          Array.from(allCurrencies),
        );
        for (const [coinId, { assetCode, currency }] of coinIdMap) {
          const price = prices[coinId]?.[currency];
          if (price !== undefined) {
            const asset = cryptoAssets.find((a) => a.code === assetCode)!;
            updates.push({ code: assetCode, price, icon: asset.icon, type: 'crypto' });
            await this.cacheManager.set(`crypto:${assetCode}`, price, CRYPTO_CACHE_TTL);
          }
        }
      }
    }

    // Batch stock prices via CafeF (single batch call for all stocks)
    const stockAssets = assets.filter((a) => a.type === 'stock');
    if (stockAssets.length > 0) {
      const allStockPrices = await this.vnStock.fetchAllStockPrices();
      const ttl = isVietnamTradingHours() ? STOCK_TRADING_CACHE_TTL : STOCK_CLOSED_CACHE_TTL;

      for (const asset of stockAssets) {
        const price = allStockPrices.get(asset.code.toUpperCase());
        if (price !== undefined) {
          updates.push({ code: asset.code, price, icon: asset.icon, type: 'stock' });
          await this.cacheManager.set(`stock:${asset.code}`, price, ttl);
        }
      }
    }

    // Batch gold prices via SJC
    const metalAssets = assets.filter((a) => a.type === 'metal');
    if (metalAssets.length > 0) {
      const allGoldPrices = await this.gold.fetchAllGoldPrices();
      for (const asset of metalAssets) {
        const goldPrice = allGoldPrices.get(asset.code.toUpperCase());
        if (goldPrice) {
          updates.push({ code: asset.code, price: goldPrice.sell, icon: asset.icon, type: 'metal' });
          await this.cacheManager.set(`gold:${asset.code}`, goldPrice.sell, CRYPTO_CACHE_TTL);
        }
      }
    }

    // Refresh exchange rates (USDT, USD, etc. → VND) via CoinGecko
    const exchangeRateUpdates: { code: string; rate: number }[] = [];
    const userCurrencies = await this.prisma.currency.findMany({ where: { userId } });
    if (userCurrencies.length > 0) {
      // Map currency codes to CoinGecko stablecoin IDs
      const currencyToCoinId: Record<string, string> = {
        USDT: 'tether',
        USD: 'usd-coin',
        USDC: 'usd-coin',
      };

      const toFetch: { code: string; coinId: string }[] = [];
      for (const cur of userCurrencies) {
        const coinId = currencyToCoinId[cur.code.toUpperCase()];
        if (coinId) toFetch.push({ code: cur.code, coinId });
      }

      if (toFetch.length > 0) {
        const coinIds = [...new Set(toFetch.map((t) => t.coinId))];
        const rates = await this.coinGecko.fetchPrices(coinIds, ['vnd']);
        for (const { code, coinId } of toFetch) {
          const rate = rates[coinId]?.vnd;
          if (rate) {
            await this.prisma.currency.update({
              where: { userId_code: { userId, code } },
              data: { rateToVnd: rate },
            });
            exchangeRateUpdates.push({ code, rate });
          }
        }
      }
    }

    // Bulk update prices in DB
    if (updates.length > 0) {
      for (const update of updates) {
        await this.prisma.price.upsert({
          where: { userId_code: { userId, code: update.code } },
          update: { price: update.price },
          create: {
            userId,
            code: update.code,
            icon: update.icon,
            type: update.type,
            price: update.price,
          },
        });
      }
    }

    return {
      updated: updates.map((u) => ({ code: u.code, type: u.type, price: u.price })),
      exchangeRates: exchangeRateUpdates,
      count: updates.length,
    };
  }
}
