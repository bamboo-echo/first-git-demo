import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { Inject } from '@nestjs/common'
import { CreateMaterialDto } from './dto/material.dto'

@Injectable()
export class MaterialsService {
  constructor(@Inject('PRISMA') private prisma: any) {}

  private async assertCourseOwner(userId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } })
    if (!course) throw new NotFoundException('课程不存在')
    if (course.userId !== userId) throw new ForbiddenException('无权操作')
    return course
  }

  async list(userId: string, courseId: string) {
    await this.assertCourseOwner(userId, courseId)
    return this.prisma.material.findMany({
      where: { courseId },
      orderBy: { uploadedAt: 'desc' },
    })
  }

  async create(userId: string, courseId: string, dto: CreateMaterialDto) {
    await this.assertCourseOwner(userId, courseId)
    return this.prisma.material.create({
      data: {
        courseId,
        title: dto.title,
        description: dto.description || '',
        format: dto.format || 'PDF',
        category: dto.category,
        status: dto.status || 'draft',
        fileName: dto.fileName,
        fileUrl: dto.fileUrl,
      },
    })
  }

  async update(userId: string, courseId: string, id: string, data: Partial<CreateMaterialDto>) {
    await this.assertCourseOwner(userId, courseId)
    return this.prisma.material.update({ where: { id_courseId: { id, courseId } }, data })
  }

  async delete(userId: string, courseId: string, id: string) {
    await this.assertCourseOwner(userId, courseId)
    await this.prisma.material.delete({ where: { id_courseId: { id, courseId } } })
    return { success: true }
  }
}
