import { Controller, Get, Req, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard'
import { HistoryService } from './history.service'

@UseGuards(JwtAuthGuard)
@Controller('api/history')
export class HistoryController {
  constructor(private service: HistoryService) {}

  @Get()
  list(@Req() req: any) {
    return this.service.list(req.user.id)
  }
}
