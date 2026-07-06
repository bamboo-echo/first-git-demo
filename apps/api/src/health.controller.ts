import { Controller, Get } from '@nestjs/common'

@Controller()
export class HealthController {
  @Get('api/health')
  health() {
    return {
      status: 'ok',
      service: 'kaodian-radar-api',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    }
  }
}
