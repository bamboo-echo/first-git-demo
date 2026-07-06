import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common'
import { TasksService } from './tasks.service'
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto'
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard'

@UseGuards(JwtAuthGuard)
@Controller('api/courses/:courseId/tasks')
export class TasksController {
  constructor(private service: TasksService) {}

  @Get()
  list(@Req() req: any, @Param('courseId') courseId: string) {
    return this.service.list(req.user.id, courseId)
  }

  @Post()
  create(@Req() req: any, @Param('courseId') courseId: string, @Body() dto: CreateTaskDto) {
    return this.service.create(req.user.id, courseId, dto)
  }

  @Put(':id')
  update(
    @Req() req: any,
    @Param('courseId') courseId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.service.update(req.user.id, courseId, id, dto)
  }

  @Put(':id/toggle')
  toggle(@Req() req: any, @Param('courseId') courseId: string, @Param('id') id: string) {
    return this.service.toggle(req.user.id, courseId, id)
  }

  @Delete(':id')
  delete(@Req() req: any, @Param('courseId') courseId: string, @Param('id') id: string) {
    return this.service.delete(req.user.id, courseId, id)
  }
}
