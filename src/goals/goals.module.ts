import { Module } from '@nestjs/common';
import { GoalsController } from './goals.controller.js';
import { GoalsService } from './goals.service.js';
import { PortfolioModule } from '../portfolio/portfolio.module.js';

@Module({
  imports: [PortfolioModule],
  controllers: [GoalsController],
  providers: [GoalsService],
  exports: [GoalsService],
})
export class GoalsModule {}
