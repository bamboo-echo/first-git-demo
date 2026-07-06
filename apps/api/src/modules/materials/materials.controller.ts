import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common'
import { MaterialsService } from './materials.service'
import { CreateMaterialDto } from './dto/material.dto'
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard'

@UseGuards(JwtAuthGuard)
@Controller('api/courses/:courseId/materials')
export class MaterialsController {
  constructor(private service: MaterialsService) {}

  @Get()
  list(@Req() req: any, @Param('courseId') courseId: string) {
    return this.service.list(req.user.id, courseId)
  }

  @Post()
  create(@Req() req: any, @Param('courseId') courseId: string, @Body() dto: CreateMaterialDto) {
    return this.service.create(req.user.id, courseId, dto)
  }

  @Put(':id')
  update(
    @Req() req: any,
    @Param('courseId') courseId: string,
    @Param('id') id: string,
    @Body() dto: Partial<CreateMaterialDto>,
  ) {
    return this.service.update(req.user.id, courseId, id, dto)
  }

  @Delete(':id')
  delete(@Req() req: any, @Param('courseId') courseId: string, @Param('id') id: string) {
    return this.service.delete(req.user.id, courseId, id)
  }
}
