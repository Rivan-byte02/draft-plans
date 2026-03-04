import { Module } from '@nestjs/common';
import { BackgroundJobsService } from './background-jobs.service';

@Module({
  providers: [BackgroundJobsService],
  exports: [BackgroundJobsService],
})
export class BackgroundJobsModule {}
