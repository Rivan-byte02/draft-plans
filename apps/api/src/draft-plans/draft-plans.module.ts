import { Module } from '@nestjs/common';
import { DraftPlansController } from './draft-plans.controller';
import { DraftPlansService } from './draft-plans.service';

@Module({
  controllers: [DraftPlansController],
  providers: [DraftPlansService],
})
export class DraftPlansModule {}
