import { Inject, Injectable } from '@nestjs/common'

@Injectable()
export class HistoryService {
  constructor(@Inject('PRISMA') private prisma: any) {}

  async list(userId: string) {
    const records = await this.prisma.historyRecord.findMany({
      where: { userId },
      orderBy: { archivedAt: 'desc' },
      take: 50,
    })
    return records.map((record: any) => ({
      ...record,
      snapshotSummary: this.parseJson(record.snapshotSummary, []),
    }))
  }

  private parseJson(value: any, fallback: any) {
    if (Array.isArray(value)) return value
    if (typeof value === 'string') {
      try { return JSON.parse(value) } catch { return fallback }
    }
    return fallback
  }
}
