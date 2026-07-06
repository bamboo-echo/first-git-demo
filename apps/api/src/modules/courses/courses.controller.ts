import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common'
import { CoursesService } from './courses.service'
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto'
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard'

@UseGuards(JwtAuthGuard)
@Controller('api/courses')
export class CoursesController {
  constructor(private service: CoursesService) {}

  @Get()
  list(@Req() req: any) {
    return this.service.list(req.user.id)
  }

  @Get(':id')
  get(@Req() req: any, @Param('id') id: string) {
    return this.service.get(req.user.id, id)
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateCourseDto) {
    return this.service.create(req.user.id, dto)
  }

  @Put(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.service.update(req.user.id, id, dto)
  }

  @Delete(':id')
  delete(@Req() req: any, @Param('id') id: string) {
    return this.service.delete(req.user.id, id)
  }
}
