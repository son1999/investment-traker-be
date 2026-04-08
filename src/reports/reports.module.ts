import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller.js';
import { ReportsService } from './reports.service.js';
import { CurrenciesModule } from '../currencies/currencies.module.js';

@Module({
  imports: [CurrenciesModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
