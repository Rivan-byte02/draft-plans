import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DraftPlansModule } from './draft-plans/draft-plans.module';
import { HealthController } from './health.controller';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    DraftPlansModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
