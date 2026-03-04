import { Module } from '@nestjs/common';
import { BackgroundJobsModule } from '../background-jobs/background-jobs.module';
import { HeroesController } from './heroes.controller';
import { HeroSyncJobWorkerService } from './hero-sync-job.worker';
import { HeroesService } from './heroes.service';

@Module({
  imports: [BackgroundJobsModule],
  controllers: [HeroesController],
  providers: [HeroesService, HeroSyncJobWorkerService],
  exports: [HeroesService],
})
export class HeroesModule {}
