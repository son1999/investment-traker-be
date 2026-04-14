import { Module } from '@nestjs/common';
import { AssetsController } from './assets.controller.js';
import { AssetsService } from './assets.service.js';
import { SavingsEventsModule } from '../savings-events/savings-events.module.js';

@Module({
  imports: [SavingsEventsModule],
  controllers: [AssetsController],
  providers: [AssetsService],
})
export class AssetsModule {}
