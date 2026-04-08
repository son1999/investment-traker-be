import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module.js';
import { SupabaseModule } from './supabase/supabase.module.js';
import { AuthModule } from './auth/auth.module.js';
import { TransactionsModule } from './transactions/transactions.module.js';
import { PricesModule } from './prices/prices.module.js';
import { PortfolioModule } from './portfolio/portfolio.module.js';
import { ReportsModule } from './reports/reports.module.js';
import { AssetsModule } from './assets/assets.module.js';
import { AllocationModule } from './allocation/allocation.module.js';
import { CurrenciesModule } from './currencies/currencies.module.js';
import { I18nModule } from './i18n/i18n.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    I18nModule,
    PrismaModule,
    SupabaseModule,
    AuthModule,
    TransactionsModule,
    PricesModule,
    PortfolioModule,
    ReportsModule,
    AssetsModule,
    AllocationModule,
    CurrenciesModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
