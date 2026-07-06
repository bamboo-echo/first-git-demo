import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { Inject } from '@nestjs/common'
import { AiService } from '../ai/ai.service'

@Injectable()
export class AnalysisService {
  constructor(
    @Inject('PRISMA') private prisma: any,
    private ai: AiService,
  ) {}

  /**
   * 触发考点雷达分析
   * 自动收集课程、资料、任务，调用 AI 或本地引擎，保存结果
   */
  async analyze(userId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: { materials: true, tasks: true },
    })
    if (!course) throw new NotFoundException('课程不存在')
    if (course.userId !== userId) throw new ForbiddenException('无权操作')

    const result = await this.ai.analyze({
      courseName: course.name,
      examTime: course.examTime,
      reviewHours: course.reviewHours,
      examScope: course.examScope,
      notes: course.notes,
      materials: course.materials.map((m: any) => ({
        title: m.title,
        category: m.category,
        status: m.status,
      })),
      tasks: course.tasks.map((t: any) => ({
        title: t.title,
        done: t.done,
        priority: t.priority,
      })),
    })

    // 保存分析结果
    const saved = await this.prisma.analysis.create({
      data: {
        courseId,
        questionTypes: JSON.stringify(result.questionTypes),
        keyPoints: JSON.stringify(result.keyPoints),
        evidence: JSON.stringify(result.evidence),
        readinessScore: result.readinessScore,
        supplementList: JSON.stringify(result.supplementList),
        summary: JSON.stringify(result.summary),
        aiProvider: result.aiProvider,
      },
    })

    return this.formatAnalysis(saved)
  }

  async latest(userId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } })
    if (!course) throw new NotFoundException('课程不存在')
    if (course.userId !== userId) throw new ForbiddenException('无权操作')

    const latest = await this.prisma.analysis.findFirst({
      where: { courseId },
      orderBy: { generatedAt: 'desc' },
    })
    return latest ? this.formatAnalysis(latest) : null
  }

  async history(userId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } })
    if (!course) throw new NotFoundException('课程不存在')
    if (course.userId !== userId) throw new ForbiddenException('无权操作')

    const list = await this.prisma.analysis.findMany({
      where: { courseId },
      orderBy: { generatedAt: 'desc' },
    })
    return list.map((a: any) => this.formatAnalysis(a))
  }

  private formatAnalysis(row: any) {
    return {
      id: row.id,
      courseId: row.courseId,
      questionTypes: this.parseJson(row.questionTypes, []),
      keyPoints: this.parseJson(row.keyPoints, []),
      evidence: this.parseJson(row.evidence, []),
      readinessScore: row.readinessScore,
      supplementList: this.parseJson(row.supplementList, []),
      summary: this.parseJson(row.summary, []),
      aiProvider: row.aiProvider,
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
}
