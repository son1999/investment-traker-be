import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { PricesController } from './prices.controller.js';
import { PricesService } from './prices.service.js';
import { PriceFetcherService } from './price-fetcher.service.js';
import { CoinGeckoProvider } from './providers/coingecko.provider.js';
import { VnStockProvider } from './providers/vnstock.provider.js';

@Module({
  imports: [CacheModule.register({ ttl: 300000 })], // 5 min default
  controllers: [PricesController],
  providers: [PricesService, PriceFetcherService, CoinGeckoProvider, VnStockProvider],
  exports: [PricesService, PriceFetcherService],
})
export class PricesModule {}
