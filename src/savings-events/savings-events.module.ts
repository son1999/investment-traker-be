import { Module } from '@nestjs/common';
import { SavingsEventsController } from './savings-events.controller.js';
import { SavingsEventsService } from './savings-events.service.js';

@Module({
  controllers: [SavingsEventsController],
  providers: [SavingsEventsService],
  exports: [SavingsEventsService],
})
export class SavingsEventsModule {}
