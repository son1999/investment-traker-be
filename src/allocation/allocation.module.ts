import { Module } from '@nestjs/common';
import { AllocationController } from './allocation.controller.js';
import { AllocationService } from './allocation.service.js';
import { CurrenciesModule } from '../currencies/currencies.module.js';
import { SavingsEventsModule } from '../savings-events/savings-events.module.js';

@Module({
  imports: [CurrenciesModule, SavingsEventsModule],
  controllers: [AllocationController],
  providers: [AllocationService],
})
export class AllocationModule {}
