import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Map common asset codes to CoinGecko IDs
const COIN_ID_MAP: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  USDT: 'tether',
  BNB: 'binancecoin',
  SOL: 'solana',
  XRP: 'ripple',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  DOT: 'polkadot',
  MATIC: 'matic-network',
  LINK: 'chainlink',
  UNI: 'uniswap',
  AVAX: 'avalanche-2',
  ATOM: 'cosmos',
  NEAR: 'near',
  APT: 'aptos',
  SUI: 'sui',
};

@Injectable()
export class CoinGeckoProvider {
  private readonly logger = new Logger(CoinGeckoProvider.name);
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get<string>(
      'COINGECKO_BASE_URL',
      'https://api.coingecko.com/api/v3',
    );
  }

  getCoinId(assetCode: string): string | null {
    return COIN_ID_MAP[assetCode.toUpperCase()] || null;
  }

  async fetchPrices(
    coinIds: string[],
    currencies: string[] = ['vnd', 'usd'],
  ): Promise<Record<string, Record<string, number>>> {
    if (coinIds.length === 0) return {};

    const url = `${this.baseUrl}/simple/price?ids=${coinIds.join(',')}&vs_currencies=${currencies.join(',')}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        this.logger.warn(`CoinGecko API error: ${response.status}`);
        return {};
      }
      return await response.json();
    } catch (error) {
      this.logger.error('Failed to fetch from CoinGecko', error);
      return {};
    }
  }

  async fetchPrice(
    assetCode: string,
    currency: string = 'vnd',
  ): Promise<number | null> {
    const coinId = this.getCoinId(assetCode);
    if (!coinId) return null;

    const result = await this.fetchPrices([coinId], [currency]);
    return result[coinId]?.[currency] ?? null;
  }
}
