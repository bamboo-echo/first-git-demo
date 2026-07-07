import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { Inject } from '@nestjs/common'
import { generatePlan, type PlanInput } from '../analysis/engine/local.engine'

@Injectable()
export class PlanService {
  constructor(@Inject('PRISMA') private prisma: any) {}

  /**
   * 生成三种复习路线：sprint / standard / supplement
   * 自动读取最新分析结果
   */
  async generate(userId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: { analyses: { orderBy: { generatedAt: 'desc' }, take: 1 } },
    })
    if (!course) throw new NotFoundException('课程不存在')
    if (course.userId !== userId) throw new ForbiddenException('无权操作')

    const latest = course.analyses?.[0]
    const keyPoints = latest ? this.parseJson(latest.keyPoints, []) : []
    const readinessScore = latest?.readinessScore ?? 0
    const supplementList = latest ? this.parseJson(latest.supplementList, []) : []

    const modes: Array<'sprint' | 'standard' | 'supplement'> = ['sprint', 'standard', 'supplement']
    const plans = modes.map((mode) => {
      const result = generatePlan({
        courseName: course.name,
        examTime: course.examTime,
        reviewHours: course.reviewHours,
        keyPoints,
        readinessScore,
        supplementList,
        mode,
      } as PlanInput)
      return { mode, ...result }
    })

    // 持久化
    await this.prisma.plan.deleteMany({ where: { courseId } })
    const created = await Promise.all(
      plans.map((p) =>
        this.prisma.plan.create({
          data: {
            courseId,
            mode: p.mode,
            title: p.title,
            description: p.description,
            items: JSON.stringify(p.items),
          },
        }),
      ),
    )

    const taskCount = await this.prisma.task.count({ where: { courseId } })
    if (taskCount === 0) {
      const recommendedMode = this.getRecommendedMode(course.reviewHours, readinessScore)
      const recommendedPlan = plans.find((plan) => plan.mode === recommendedMode) || plans[0]
      await Promise.all(
        recommendedPlan.items.map((item, index) =>
          this.prisma.task.create({
            data: {
              courseId,
              title: item,
              detail: `${recommendedPlan.title} · 第 ${index + 1} 步`,
              duration: index === 0 ? '45分钟' : '30分钟',
              priority: index < 2 ? 'high' : 'medium',
              mode: recommendedPlan.mode,
              order: index + 1,
            },
          }),
        ),
      )
    }

    return created.map((c: any) => this.format(c))
  }

  async list(userId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } })
    if (!course) throw new NotFoundException('课程不存在')
    if (course.userId !== userId) throw new ForbiddenException('无权操作')
    const list = await this.prisma.plan.findMany({ where: { courseId } })
    return list.map((p: any) => this.format(p))
  }

  private format(row: any) {
    return {
      id: row.id,
      courseId: row.courseId,
      mode: row.mode,
      title: row.title,
      description: row.description,
      items: this.parseJson(row.items, []),
      generatedAt: row.generatedAt,
    }
  }

  private parseJson(value: any, fallback: any) {
    if (Array.isArray(value)) return value
    if (typeof value === 'string') {
      try { return JSON.parse(value) } catch { return fallback }
    }
    return fallback
  }

  private getRecommendedMode(reviewHours: string, readinessScore: number): 'sprint' | 'standard' | 'supplement' {
    const hours = Number.parseFloat((reviewHours || '8').match(/\d+(?:\.\d+)?/)?.[0] || '8')
    if (hours <= 6 || readinessScore < 45) return 'sprint'
    if (hours >= 18 && readinessScore >= 70) return 'supplement'
    return 'standard'
  }
}
