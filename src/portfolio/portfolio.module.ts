import { Module } from '@nestjs/common';
import { PortfolioController } from './portfolio.controller.js';
import { PortfolioService } from './portfolio.service.js';
import { CurrenciesModule } from '../currencies/currencies.module.js';

@Module({
  imports: [CurrenciesModule],
  controllers: [PortfolioController],
  providers: [PortfolioService],
  exports: [PortfolioService],
})
export class PortfolioModule {}
