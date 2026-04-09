import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Vietnamese gold price provider using SJC official API.
 * Returns gold prices in VND per lượng (tael).
 */
@Injectable()
export class GoldProvider {
  private readonly logger = new Logger(GoldProvider.name);
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get<string>(
      'SJC_BASE_URL',
      'https://sjc.com.vn',
    );
  }

  // Map common gold asset codes to SJC TypeName keywords
  // Users can create assets with any of these codes
  private static readonly GOLD_TYPE_MAP: Record<string, string> = {
    GOLD: 'Vàng SJC 1L, 10L, 1KG',
    SJC: 'Vàng SJC 1L, 10L, 1KG',
    'SJC-5CHI': 'Vàng SJC 5 chỉ',
    'NHAN-SJC': 'Vàng nhẫn SJC 99,99% 1 chỉ, 2 chỉ, 5 chỉ',
    '9999': 'Vàng nhẫn SJC 99,99% 1 chỉ, 2 chỉ, 5 chỉ',
    NHAN9999: 'Vàng nhẫn SJC 99,99% 1 chỉ, 2 chỉ, 5 chỉ',
    PNJ: 'Nữ trang 99,99%',
  };

  async fetchAllGoldPrices(): Promise<Map<string, { buy: number; sell: number }>> {
    const map = new Map<string, { buy: number; sell: number }>();

    try {
      const url = `${this.baseUrl}/GoldPrice/Services/PriceService.ashx?Method=GetGoldPrice`;
      const response = await fetch(url);

      if (!response.ok) {
        this.logger.warn(`SJC API error: ${response.status}`);
        return map;
      }

      const result = await response.json() as {
        success: boolean;
        data: { TypeName: string; BranchName: string; BuyValue: number; SellValue: number }[];
      };

      if (!result.success || !result.data) return map;

      // Only use HCM branch prices (most standard)
      const hcmPrices = result.data.filter((d) => d.BranchName === 'Hồ Chí Minh');

      // SJC API returns price per lượng (tael = 10 chỉ)
      // Convert to price per chỉ (1/10 lượng) so users can track in chỉ units
      for (const [code, typeName] of Object.entries(GoldProvider.GOLD_TYPE_MAP)) {
        const item = hcmPrices.find((d) => d.TypeName === typeName);
        if (item && item.SellValue > 0) {
          map.set(code, {
            buy: Math.round(item.BuyValue / 10),
            sell: Math.round(item.SellValue / 10),
          });
        }
      }

      this.logger.log(`Fetched ${map.size} gold prices from SJC`);
      return map;
    } catch (error) {
      this.logger.error('Failed to fetch from SJC', error);
      return map;
    }
  }

  /**
   * Fetch sell price for a gold asset code.
   * Returns price in VND per lượng.
   */
  async fetchGoldPrice(code: string): Promise<number | null> {
    const allPrices = await this.fetchAllGoldPrices();
    const price = allPrices.get(code.toUpperCase());
    return price?.sell ?? null;
  }
}
