import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service.js';
import { CoinGeckoProvider } from './providers/coingecko.provider.js';
import { VnStockProvider } from './providers/vnstock.provider.js';
import { isVietnamTradingHours } from './helpers/trading-hours.helper.js';

const CRYPTO_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const STOCK_CACHE_TTL = 5 * 60 * 1000; // 5 minutes during trading hours

@Injectable()
export class PriceFetcherService {
  private readonly logger = new Logger(PriceFetcherService.name);

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private prisma: PrismaService,
    private coinGecko: CoinGeckoProvider,
    private vnStock: VnStockProvider,
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

    // Outside trading hours, return cached value without calling API
    if (!isVietnamTradingHours()) {
      return cached ?? null;
    }

    if (cached !== undefined && cached !== null) return cached;

    const price = await this.vnStock.fetchStockPrice(code);
    if (price !== null) {
      await this.cacheManager.set(cacheKey, price, STOCK_CACHE_TTL);
    }
    return price;
  }

  async getLivePrice(code: string, type: string): Promise<number | null> {
    switch (type) {
      case 'crypto':
        return this.getCryptoPrice(code);
      case 'stock':
        return this.getStockPrice(code);
      default:
        return null; // metal/savings: no auto-fetch
    }
  }

  async refreshAllPrices(userId: string) {
    const assets = await this.prisma.asset.findMany({
      where: { userId },
      select: { code: true, type: true, icon: true },
    });

    const updates: { code: string; price: number; icon: string; type: string }[] = [];

    // Batch crypto prices via CoinGecko (single API call)
    const cryptoAssets = assets.filter((a) => a.type === 'crypto');
    if (cryptoAssets.length > 0) {
      const coinIdMap = new Map<string, string>();
      for (const asset of cryptoAssets) {
        const coinId = this.coinGecko.getCoinId(asset.code);
        if (coinId) coinIdMap.set(coinId, asset.code);
      }

      if (coinIdMap.size > 0) {
        const prices = await this.coinGecko.fetchPrices(
          Array.from(coinIdMap.keys()),
          ['vnd'],
        );
        for (const [coinId, assetCode] of coinIdMap) {
          const price = prices[coinId]?.vnd;
          if (price !== undefined) {
            const asset = cryptoAssets.find((a) => a.code === assetCode)!;
            updates.push({ code: assetCode, price, icon: asset.icon, type: 'crypto' });
            await this.cacheManager.set(`crypto:${assetCode}`, price, CRYPTO_CACHE_TTL);
          }
        }
      }
    }

    // Fetch stock prices (only during trading hours)
    if (isVietnamTradingHours()) {
      const stockAssets = assets.filter((a) => a.type === 'stock');
      for (const asset of stockAssets) {
        const price = await this.vnStock.fetchStockPrice(asset.code);
        if (price !== null) {
          updates.push({ code: asset.code, price, icon: asset.icon, type: 'stock' });
          await this.cacheManager.set(`stock:${asset.code}`, price, STOCK_CACHE_TTL);
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
      count: updates.length,
    };
  }
}
