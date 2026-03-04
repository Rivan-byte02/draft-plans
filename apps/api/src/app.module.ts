import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DraftPlansModule } from './draft-plans/draft-plans.module';
import { HealthController } from './health.controller';
import { HeroesModule } from './heroes/heroes.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    HeroesModule,
    DraftPlansModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
