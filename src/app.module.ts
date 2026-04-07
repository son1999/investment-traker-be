import { Module } from '@nestjs/common';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    SupabaseModule,
    AuthModule,
    TransactionsModule,
    PricesModule,
    PortfolioModule,
    ReportsModule,
    AssetsModule,
    AllocationModule,
  ],
})
export class AppModule {}
