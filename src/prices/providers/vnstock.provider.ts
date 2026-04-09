import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class VnStockProvider {
  private readonly logger = new Logger(VnStockProvider.name);
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('VNSTOCK_API_KEY', '');
  }

  async fetchStockPrice(symbol: string): Promise<number | null> {
    if (!this.apiKey) {
      this.logger.warn('VNSTOCK_API_KEY not configured');
      return null;
    }

    const url = `https://api.vnstock.io/api/v1/stock/price?symbol=${symbol.toUpperCase()}`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        this.logger.warn(`VnStock API error for ${symbol}: ${response.status}`);
        return null;
      }

      const data = await response.json();

      // Extract close price from response
      if (data?.data?.close) {
        return data.data.close * 1000; // VnStock returns price in 1000 VND
      }
      if (data?.data?.price) {
        return data.data.price * 1000;
      }
      if (typeof data?.price === 'number') {
        return data.price * 1000;
      }

      this.logger.warn(`Unexpected VnStock response format for ${symbol}`);
      return null;
    } catch (error) {
      this.logger.error(`Failed to fetch stock price for ${symbol}`, error);
      return null;
    }
  }
}
