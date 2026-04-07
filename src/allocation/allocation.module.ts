import { Module } from '@nestjs/common';
import { AllocationController } from './allocation.controller.js';
import { AllocationService } from './allocation.service.js';

@Module({
  controllers: [AllocationController],
  providers: [AllocationService],
})
export class AllocationModule {}
