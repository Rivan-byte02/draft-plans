import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { HeroesService } from './heroes.service';

@Controller('heroes')
export class HeroesController {
  constructor(private readonly heroesService: HeroesService) {}

  @Get()
  listHeroes(@Query('refresh') refresh?: string) {
    return this.heroesService.listHeroes(refresh === 'true');
  }

  @Post('sync')
  syncHeroes() {
    return this.heroesService.syncHeroes();
  }

  @Get('cache')
  getHeroCache() {
    return this.heroesService.getHeroCache();
  }

  @Post('sync-jobs')
  queueHeroSyncJob() {
    return this.heroesService.queueHeroSyncJob();
  }

  @Get('sync-jobs/:jobId')
  getHeroSyncJob(@Param('jobId') jobId: string) {
    return this.heroesService.getHeroSyncJob(jobId);
  }
}
