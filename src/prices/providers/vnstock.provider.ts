import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Vietnamese stock price provider using CafeF public API.
 * Fetches real-time prices from HOSE and HNX exchanges.
 * No API key required. Price unit: VND (field 'e' * 1000).
 */
@Injectable()
export class VnStockProvider {
  private readonly logger = new Logger(VnStockProvider.name);
  private readonly baseUrl: string;
  private cachedStocks: Map<string, number> | null = null;
  private lastFetchTime = 0;
  private static readonly BATCH_CACHE_TTL = 30_000; // 30s cache for full list

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get<string>(
      'CAFEF_BASE_URL',
      'https://banggia.cafef.vn',
    );
  }

  /**
   * Fetch all stock prices from HOSE + HNX in one batch call.
   * Returns a Map<symbol, priceInVND>.
   */
  async fetchAllStockPrices(): Promise<Map<string, number>> {
    const now = Date.now();
    if (this.cachedStocks && now - this.lastFetchTime < VnStockProvider.BATCH_CACHE_TTL) {
      return this.cachedStocks;
    }

    try {
      const [hoseRes, hnxRes] = await Promise.all([
        fetch(`${this.baseUrl}/stockhandler.ashx?center=1&index=false`),
        fetch(`${this.baseUrl}/stockhandler.ashx?center=2&index=false`),
      ]);

      if (!hoseRes.ok || !hnxRes.ok) {
        this.logger.warn(`CafeF API error: HOSE=${hoseRes.status}, HNX=${hnxRes.status}`);
        return this.cachedStocks || new Map();
      }

      const [hoseData, hnxData] = await Promise.all([
        hoseRes.json() as Promise<{ a: string; e: number }[]>,
        hnxRes.json() as Promise<{ a: string; e: number }[]>,
      ]);

      const map = new Map<string, number>();
      for (const stock of [...hoseData, ...hnxData]) {
        if (stock.a && typeof stock.e === 'number' && stock.e > 0) {
          map.set(stock.a, stock.e * 1000); // CafeF returns price in 1000 VND
        }
      }

      this.cachedStocks = map;
      this.lastFetchTime = now;
      this.logger.log(`Fetched ${map.size} stock prices from CafeF`);
      return map;
    } catch (error) {
      this.logger.error('Failed to fetch from CafeF', error);
      return this.cachedStocks || new Map();
    }
  }

  /**
   * Fetch price for a single stock symbol.
   */
  async fetchStockPrice(symbol: string): Promise<number | null> {
    const allPrices = await this.fetchAllStockPrices();
    return allPrices.get(symbol.toUpperCase()) ?? null;
  }
}
