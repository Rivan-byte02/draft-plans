import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/public.decorator';

@Controller('health')
@Public()
export class HealthController {
  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: 'draft-plans-api',
    };
  }
}
