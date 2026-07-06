import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios from 'axios'
import { analyzeCourseLocal, type AnalysisInput } from '../analysis/engine/local.engine'

export type AiProvider = 'local' | 'openai' | 'deepseek'

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name)
  private provider: AiProvider
  private apiKey: string
  private baseUrl: string

  constructor(private config: ConfigService) {
    this.provider = (this.config.get<string>('AI_PROVIDER') as AiProvider) || 'local'
    this.apiKey = this.config.get<string>('AI_API_KEY') || ''
    this.baseUrl = this.config.get<string>('AI_BASE_URL') || ''
  }

  getProvider(): AiProvider {
    if (this.provider === 'local') return 'local'
    if (!this.apiKey) {
      this.logger.warn('AI_API_KEY 未配置，自动降级为本地规则引擎')
      return 'local'
    }
    return this.provider
  }

  /**
   * 主分析接口：混合策略
   * 1. 默认走本地规则引擎（保证可用）
   * 2. 如果 AI 配置了，调用 AI 增强
   * 3. 失败时回退本地
   */
  async analyze(input: AnalysisInput) {
    const localResult = analyzeCourseLocal(input)
    const provider = this.getProvider()

    if (provider === 'local') {
      return { ...localResult, aiProvider: 'local' as AiProvider, generatedAt: new Date().toISOString() }
    }

    try {
      const aiResult = await this.callExternalAi(input)
      return { ...aiResult, aiProvider: provider, generatedAt: new Date().toISOString() }
    } catch (err) {
      this.logger.error(`AI 调用失败，降级为本地引擎: ${err.message}`)
      return { ...localResult, aiProvider: 'local' as AiProvider, generatedAt: new Date().toISOString() }
    }
  }

  private async callExternalAi(input: AnalysisInput) {
    const local = analyzeCourseLocal(input)

    // 构造 Prompt
    const prompt = `你是一个考点分析助手。基于以下课程信息，输出更精准的考点分析。\n\n` +
      `课程：${input.courseName}\n` +
      `考试时间：${input.examTime || '未指定'}\n` +
      `复习时长：${input.reviewHours || '8'}小时\n` +
      `考试范围：${input.examScope || '未指定'}\n` +
      `资料数：${input.materials?.length || 0}（已就绪 ${input.materials?.filter(m => m.status === 'ready').length || 0}）\n` +
      `本地算法初判：\n` +
      `- 题型：${local.questionTypes.join('、')}\n` +
      `- 考点：${local.keyPoints.join('、')}\n` +
      `- 准备度：${local.readinessScore}%\n\n` +
      `请基于以上信息，输出 JSON：\n` +
      `{"questionTypes": ["题型1 占比", "题型2 占比"], "keyPoints": ["考点1", "考点2"], "evidence": ["依据1", "依据2"], "supplementList": ["补充建议1"], "summary": ["要点1"]}\n` +
      `要求：\n1. questionTypes 4 项以内，加百分比\n2. keyPoints 5 项以内\n3. evidence 2-4 条，简短\n4. supplementList 1-3 条建议\n5. summary 2-4 条关键摘要\n6. 直接返回 JSON，不要 Markdown 代码块`

    if (this.provider === 'deepseek') {
      return this.callDeepSeek(prompt, local)
    }
    if (this.provider === 'openai') {
      return this.callOpenAI(prompt, local)
    }
    return local
  }

  private async callDeepSeek(prompt: string, fallback: any) {
    const url = this.baseUrl || 'https://api.deepseek.com/v1/chat/completions'
    const res = await axios.post(
      url,
      {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '你是考点分析助手，输出严格 JSON' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      },
      {
        headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
        timeout: 30000,
      },
    )
    const content = res.data?.choices?.[0]?.message?.content || ''
    return this.parseAiJson(content, fallback)
  }

  private async callOpenAI(prompt: string, fallback: any) {
    const url = this.baseUrl || 'https://api.openai.com/v1/chat/completions'
    const res = await axios.post(
      url,
      {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: '你是考点分析助手，输出严格 JSON' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      },
      {
        headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
        timeout: 30000,
      },
    )
    const content = res.data?.choices?.[0]?.message?.content || ''
    return this.parseAiJson(content, fallback)
  }

  private parseAiJson(content: string, fallback: any) {
    try {
      // 清理可能的 Markdown 包裹
      const cleaned = content.replace(/```json\s*|\s*```/g, '').trim()
      const parsed = JSON.parse(cleaned)
      return {
        questionTypes: parsed.questionTypes || fallback.questionTypes,
        keyPoints: parsed.keyPoints || fallback.keyPoints,
        evidence: parsed.evidence || fallback.evidence,
        readinessScore: fallback.readinessScore, // 准备度仍由本地计算
        supplementList: parsed.supplementList || fallback.supplementList,
        summary: parsed.summary || fallback.summary,
      }
    } catch (err) {
      this.logger.warn('AI 返回 JSON 解析失败，使用本地结果')
      return fallback
    }
  }
}
