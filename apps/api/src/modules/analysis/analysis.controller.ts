import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common'
import { AnalysisService } from './analysis.service'
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard'

@UseGuards(JwtAuthGuard)
@Controller('api/courses/:courseId/analysis')
export class AnalysisController {
  constructor(private service: AnalysisService) {}

  @Post()
  analyze(@Req() req: any, @Param('courseId') courseId: string) {
    return this.service.analyze(req.user.id, courseId)
  }

  @Get('latest')
  latest(@Req() req: any, @Param('courseId') courseId: string) {
    return this.service.latest(req.user.id, courseId)
  }

  @Get()
  history(@Req() req: any, @Param('courseId') courseId: string) {
    return this.service.history(req.user.id, courseId)
  }
}
