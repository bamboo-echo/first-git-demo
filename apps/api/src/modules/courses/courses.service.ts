import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { Inject } from '@nestjs/common'
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto'

@Injectable()
export class CoursesService {
  constructor(@Inject('PRISMA') private prisma: any) {}

  async list(userId: string) {
    return this.prisma.course.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { materials: true, tasks: true, analyses: true } },
      },
    })
  }

  async get(userId: string, id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        materials: { orderBy: { uploadedAt: 'desc' } },
        tasks: { orderBy: [{ mode: 'asc' }, { order: 'asc' }] },
        analyses: { orderBy: { generatedAt: 'desc' }, take: 1 },
        plans: { orderBy: { generatedAt: 'desc' } },
      },
    })
    if (!course) throw new NotFoundException('课程不存在')
    if (course.userId !== userId) throw new ForbiddenException('无权访问')
    return course
  }

  async create(userId: string, dto: CreateCourseDto) {
    return this.prisma.course.create({
      data: {
        userId,
        name: dto.name,
        examTime: dto.examTime || '',
        reviewHours: dto.reviewHours || '8',
        goalMode: dto.goalMode || '冲刺',
        examScope: dto.examScope || '',
        notes: dto.notes || '',
      },
    })
  }

  async update(userId: string, id: string, dto: UpdateCourseDto) {
    const course = await this.prisma.course.findUnique({ where: { id } })
    if (!course) throw new NotFoundException('课程不存在')
    if (course.userId !== userId) throw new ForbiddenException('无权操作')
    return this.prisma.course.update({ where: { id }, data: dto })
  }

  async delete(userId: string, id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        tasks: true,
        analyses: { orderBy: { generatedAt: 'desc' }, take: 1 },
      },
    })
    if (!course) throw new NotFoundException('课程不存在')
    if (course.userId !== userId) throw new ForbiddenException('无权操作')

    const latestAnalysis = course.analyses?.[0]
    const keyPoints = this.parseJson(latestAnalysis?.keyPoints, [])
    const summary = this.parseJson(latestAnalysis?.summary, [])
    const tasksTotal = course.tasks.length
    const tasksDone = course.tasks.filter((task: any) => task.done).length

    await this.prisma.historyRecord.create({
      data: {
        userId,
        courseId: course.id,
        courseName: course.name,
        finalScore: latestAnalysis?.readinessScore ?? null,
        keyPointsCount: keyPoints.length,
        tasksTotal,
        tasksDone,
        snapshotSummary: JSON.stringify(summary),
      },
    })

    await this.prisma.course.delete({ where: { id } })
    return { success: true }
  }

  private parseJson(value: any, fallback: any) {
    if (Array.isArray(value)) return value
    if (typeof value === 'string') {
      try { return JSON.parse(value) } catch { return fallback }
    }
    return fallback
  }
}
