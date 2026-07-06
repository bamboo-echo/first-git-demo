import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { Inject } from '@nestjs/common'
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto'

@Injectable()
export class TasksService {
  constructor(@Inject('PRISMA') private prisma: any) {}

  private async assertCourseOwner(userId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } })
    if (!course) throw new NotFoundException('课程不存在')
    if (course.userId !== userId) throw new ForbiddenException('无权操作')
  }

  async list(userId: string, courseId: string) {
    await this.assertCourseOwner(userId, courseId)
    return this.prisma.task.findMany({
      where: { courseId },
      orderBy: [{ mode: 'asc' }, { order: 'asc' }],
    })
  }

  async create(userId: string, courseId: string, dto: CreateTaskDto) {
    await this.assertCourseOwner(userId, courseId)
    return this.prisma.task.create({
      data: {
        courseId,
        title: dto.title,
        detail: dto.detail || '',
        duration: dto.duration || '30分钟',
        priority: dto.priority || 'medium',
        mode: dto.mode || 'standard',
        done: dto.done || false,
        order: dto.order || 0,
      },
    })
  }

  async update(userId: string, courseId: string, id: string, dto: UpdateTaskDto) {
    await this.assertCourseOwner(userId, courseId)
    return this.prisma.task.update({ where: { id }, data: dto })
  }

  async toggle(userId: string, courseId: string, id: string) {
    await this.assertCourseOwner(userId, courseId)
    const task = await this.prisma.task.findUnique({ where: { id } })
    return this.prisma.task.update({ where: { id }, data: { done: !task.done } })
  }

  async delete(userId: string, courseId: string, id: string) {
    await this.assertCourseOwner(userId, courseId)
    await this.prisma.task.delete({ where: { id } })
    return { success: true }
  }
}
