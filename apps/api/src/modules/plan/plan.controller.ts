import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common'
import { PlanService } from './plan.service'
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard'

@UseGuards(JwtAuthGuard)
@Controller('api/courses/:courseId/plans')
export class PlanController {
  constructor(private service: PlanService) {}

  @Post()
  generate(@Req() req: any, @Param('courseId') courseId: string) {
    return this.service.generate(req.user.id, courseId)
  }

  @Get()
  list(@Req() req: any, @Param('courseId') courseId: string) {
    return this.service.list(req.user.id, courseId)
  }
}
