// 核心分析引擎 - 考点雷达算法
// 从前端的 utils/analysisEngine.ts 迁移并增强

export type AnalysisInput = {
  courseName: string
  examTime: string
  reviewHours: string
  examScope: string
  notes: string
  materials: Array<{
    title: string
    description?: string
    category: 'exam' | 'ppt' | 'catalog' | 'scope' | 'notes' | 'exercises'
    status: 'ready' | 'draft'
  }>
  tasks: Array<{
    title: string
    done: boolean
    priority: 'high' | 'medium'
  }>
}

export type AnalysisOutput = {
  questionTypes: string[]
  keyPoints: string[]
  evidence: string[]
  readinessScore: number
  supplementList: string[]
  summary: string[]
  aiProvider: 'local' | 'openai' | 'deepseek'
  generatedAt: string
}

// 题型分布模板
const questionTypeTemplates: Record<string, string[]> = {
  软件工程: ['简答题 36%', '选择题 30%', '计算题 20%', '案例分析 14%'],
  数据结构: ['代码题 35%', '选择题 25%', '填空题 20%', '应用题 20%'],
  操作系统: ['简答题 30%', '计算题 30%', '选择题 25%', '综合题 15%'],
  计算机网络: ['选择题 35%', '简答题 30%', '计算题 20%', '综合设计 15%'],
  数据库: ['SQL 设计 30%', '简答题 30%', '选择题 25%', 'ER 图 15%'],
  高数: ['计算题 50%', '证明题 25%', '应用题 25%'],
  英语: ['阅读理解 40%', '完形填空 20%', '写作 20%', '翻译 20%'],
  线性代数: ['计算题 45%', '证明题 30%', '选择题 25%'],
  概率论: ['计算题 50%', '证明题 30%', '应用题 20%'],
}

// 高频考点模板
const keyPointTemplates: Record<string, string[]> = {
  软件工程: ['需求分析方法', '软件生命周期模型', 'UML 图与用例建模', '测试用例设计', '项目管理与进度安排'],
  数据结构: ['二叉树遍历', '快速排序与归并排序', '图的遍历与最短路径', '栈与队列应用', '查找算法'],
  操作系统: ['进程调度算法', '内存分页与分段', '文件系统', '死锁与银行家算法', '虚拟内存'],
  计算机网络: ['TCP/IP 协议栈', '子网划分', '路由算法', 'HTTP 与 DNS', '可靠传输机制'],
  数据库: ['SQL 查询与优化', '范式与关系模型', '事务与并发控制', 'ER 图设计', '索引与存储'],
  高数: ['极限与连续', '导数与微分', '积分学', '多元函数', '级数理论'],
  英语: ['阅读理解技巧', '写作常用句式', '高频词汇', '长难句分析', '翻译策略'],
  线性代数: ['矩阵运算', '行列式', '特征值与特征向量', '线性方程组', '向量空间'],
  概率论: ['随机变量', '概率分布', '大数定律', '参数估计', '假设检验'],
}

// 默认值
const defaultQuestionTypes = ['简答题 35%', '选择题 30%', '计算题 20%', '综合题 15%']
const defaultKeyPoints = ['核心概念辨析', '典型题型解法', '重点公式定理', '真题高频考点', '易错点归纳']

const categoryWeights: Record<string, number> = {
  exam: 34,
  scope: 24,
  ppt: 18,
  catalog: 14,
  exercises: 7,
  notes: 3,
}

function parseReviewHours(hoursText: string): number {
  const match = hoursText?.match(/(\d+(?:\.\d+)?)/)
  return match ? parseFloat(match[1]) : 8
}

function findMatchKey(name: string, templates: Record<string, string[]>): string | null {
  return Object.keys(templates).find((k) => name?.includes(k)) || null
}

function tokenizeText(text: string): string[] {
  return (text || '')
    .replace(/[，。！？、；：,.!?;:()（）【】\[\]《》]/g, ' ')
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 2)
}

function extractMaterialSignals(input: AnalysisInput) {
  const scores = new Map<string, number>()
  for (const material of input.materials || []) {
    const base = material.status === 'ready' ? categoryWeights[material.category] || 5 : 2
    const text = `${material.title || ''} ${material.description || ''}`
    for (const token of tokenizeText(text).slice(0, 8)) {
      scores.set(token, (scores.get(token) || 0) + base)
    }
  }
  for (const token of tokenizeText(`${input.examScope || ''} ${input.notes || ''}`).slice(0, 20)) {
    scores.set(token, (scores.get(token) || 0) + 12)
  }
  return Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, score]) => ({ name, score }))
}

function getRemainingDays(examTime: string): number {
  if (!examTime) return 30
  const exam = new Date(examTime)
  if (isNaN(exam.getTime())) return 30
  const now = new Date()
  const diff = exam.getTime() - now.getTime()
  return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

/**
 * 准备度评分算法
 * 综合考虑：资料完整度、任务完成度、考点识别度、剩余时间
 */
function calculateReadinessScore(input: AnalysisInput): number {
  let score = 0
  const materials = input.materials || []
  const tasks = input.tasks || []

  // 资料完整度（最高 40 分）
  const totalMaterials = materials.length
  const readyMaterials = materials.filter((m) => m.status === 'ready').length
  if (totalMaterials > 0) {
    const materialScore = (readyMaterials / totalMaterials) * 40
    score += materialScore
  }

  // 真题存在加分（10 分）
  if (materials.some((m) => m.category === 'exam' && m.status === 'ready')) {
    score += 10
  }

  // 教材目录加分（10 分）
  if (materials.some((m) => m.category === 'catalog' && m.status === 'ready')) {
    score += 10
  }

  // 任务完成度（最高 20 分）
  if (tasks.length > 0) {
    const done = tasks.filter((t) => t.done).length
    score += (done / tasks.length) * 20
  }

  // 考试范围信息（10 分）
  if (input.examScope && input.examScope.trim().length > 0) {
    score += 10
  } else {
    score += 3 // 默认给 3 分
  }

  // 剩余时间评估（最多扣 20 分）
  const days = getRemainingDays(input.examTime)
  if (days < 3) {
    score -= 10 // 时间太紧减分
  } else if (days < 7) {
    score -= 5
  }

  return Math.max(0, Math.min(100, Math.round(score)))
}

/**
 * 主分析函数
 */
export function analyzeCourseLocal(input: AnalysisInput): Omit<AnalysisOutput, 'aiProvider' | 'generatedAt'> {
  const courseName = input.courseName || '通用课程'
  const hasExam = (input.materials || []).some((m) => m.category === 'exam' && m.status === 'ready')
  const hasScope = Boolean(input.examScope?.trim()) || (input.materials || []).some((m) => m.category === 'scope' && m.status === 'ready')
  const hasTeacherSignal = Boolean(input.notes?.trim()) || (input.materials || []).some((m) => ['ppt', 'notes'].includes(m.category) && m.status === 'ready')
  const materialSignals = extractMaterialSignals(input)

  // 1. 题型结构
  const matchedKey = findMatchKey(courseName, questionTypeTemplates)
  const questionTypes = matchedKey && hasExam
    ? questionTypeTemplates[matchedKey]
    : hasExam ? defaultQuestionTypes : ['待导入真题后生成']

  // 2. 高频考点
  const matchedPointKey = findMatchKey(courseName, keyPointTemplates)
  const templatePoints = matchedPointKey ? keyPointTemplates[matchedPointKey] : defaultKeyPoints
  const signalPoints = materialSignals
    .filter((signal) => !templatePoints.some((point) => point.includes(signal.name) || signal.name.includes(point)))
    .slice(0, 3)
    .map((signal) => `${signal.name} · 资料命中 ${signal.score}`)
  const keyPoints = [...templatePoints.slice(0, 4), ...signalPoints].slice(0, 7)

  // 3. 来源依据
  const evidence: string[] = []
  const readyCount = (input.materials || []).filter((m) => m.status === 'ready').length
  if (readyCount > 0) {
    evidence.push(`${readyCount} 份资料已进入分析池，真题是题型结构的主要来源`)
  } else {
    evidence.push('尚未导入任何资料，建议先上传真题、PPT 与教材目录')
  }
  if ((input.materials || []).some((m) => m.category === 'ppt' && m.status === 'ready')) {
    evidence.push('老师课件已覆盖课堂重点来源')
  } else {
    evidence.push('老师课件来源仍需补充')
  }
  if ((input.materials || []).some((m) => m.category === 'catalog' && m.status === 'ready')) {
    evidence.push('教材目录已建立章节树，可生成目录排序视图')
  } else {
    evidence.push('待补齐教材目录后建立章节树')
  }
  if (input.examScope && input.examScope.trim().length > 0) {
    evidence.push('考试范围已较清晰，可生成题型命中区')
  } else {
    evidence.push('考试范围信息仍是草稿状态，建议补充')
  }
  if (hasTeacherSignal) {
    evidence.push('老师强调信息已纳入权重，课件/备注会提升相关章节优先级')
  }
  if (hasScope) {
    evidence.push('考试范围与资料标题已交叉匹配，用于生成章节重点区')
  }

  // 4. 准备度
  const readinessScore = calculateReadinessScore(input)

  // 5. 补充清单
  const supplementList: string[] = []
  if (!hasExam) supplementList.push('上传至少 1 份真题，用于识别题型结构')
  if (!(input.materials || []).some((m) => m.category === 'catalog')) {
    supplementList.push('补齐教材目录或大纲，建立章节树')
  }
  if (!(input.materials || []).some((m) => m.category === 'ppt')) {
    supplementList.push('导入老师课件或讲义，识别老师重点')
  }
  if (!input.examScope) supplementList.push('完善考试范围说明')
  if (!hasTeacherSignal) supplementList.push('补充老师强调内容或课堂笔记，提升重点判断可信度')

  const remainingDays = getRemainingDays(input.examTime)
  if (remainingDays < 7) {
    supplementList.push(`距离考试仅 ${remainingDays} 天，建议切换为极速版复习策略`)
  }

  // 6. 课程摘要
  const pendingTasks = (input.tasks || []).filter((t) => !t.done).length
  const totalTasks = (input.tasks || []).length
  const summary: string[] = [
    `课程：${courseName}`,
    `已就绪资料 ${readyCount} 份`,
    `当前剩余任务 ${pendingTasks} / ${totalTasks} 项`,
    `资料信号 ${materialSignals.slice(0, 3).map((signal) => signal.name).join('、') || '待补充'}`,
    `剩余复习时间 ${input.reviewHours || '8'} 小时 · ${
      parseReviewHours(input.reviewHours) >= 24 ? '时间充裕，建议标准版' : '时间紧张，建议极速版'
    }`,
  ]

  return {
    questionTypes,
    keyPoints,
    evidence,
    readinessScore,
    supplementList,
    summary,
  }
}

/**
 * 复习路线生成（极速版/标准版/补充版）
 */
export type PlanInput = {
  courseName: string
  examTime: string
  reviewHours: string
  keyPoints: string[]
  readinessScore: number
  supplementList?: string[]
  mode: 'sprint' | 'standard' | 'supplement'
}

export type PlanOutput = {
  title: string
  description: string
  items: string[]
}

export function generatePlan(input: PlanInput): PlanOutput {
  const hours = parseReviewHours(input.reviewHours)
  const keyPoints = input.keyPoints || []
  const supplementList = input.supplementList || []
  const remainingDays = getRemainingDays(input.examTime)
  const intensity = hours <= 4 || remainingDays <= 2 ? '极限冲刺' : hours <= 12 || remainingDays <= 7 ? '高压冲刺' : '系统推进'

  if (input.mode === 'sprint') {
    const sprintItems = [
      `先用 ${Math.min(45, Math.max(20, Math.round(hours * 10)))} 分钟速览 ${keyPoints.slice(0, 2).join('、') || '核心考点'} 的结论与公式`,
      '用 1 套真题限时自测，标记错点',
      `回炉错点对应的 ${keyPoints[2] || '高频考点'}`,
    ]
    if (input.readinessScore < 50) sprintItems.push('只保留最高频题型，低收益章节暂缓')
    return {
      title: '极速版 · 路线',
      description: `${intensity}策略：优先覆盖最高收益考点`,
      items: sprintItems,
    }
  }

  if (input.mode === 'supplement') {
    const supplementItems = [
      `梳理 ${keyPoints.slice(2).join('、') || '次重点'}`,
      ...(supplementList.length > 0 ? supplementList.slice(0, 2) : ['查漏：对比多份资料的差异点']),
      '默写关键公式与定义，做最后一轮核对',
      '整理易错题清单，考前 24 小时过一遍',
    ]
    return {
      title: '补充版 · 路线',
      description: '完成核心后补齐次重点与易漏点',
      items: supplementItems,
    }
  }

  // standard
  const dayBudget = Math.max(1, Math.round(hours / 4))
  return {
    title: '标准版 · 路线',
    description: `${intensity}策略：按章节系统梳理并滚动校准`,
    items: [
      `用 ${dayBudget} 天通读 ${keyPoints[0] || '第一章'}，建立主线`,
      `真题映射 ${keyPoints.slice(0, 3).join('、')} 知识点与题型结构`,
      input.readinessScore >= 70 ? '用错题回看验证高频考点掌握度' : '先补齐目录/范围/课件，再增强结构化复习',
      '结合考试范围做优先级裁剪',
      '考前两天做完整套卷模拟，定位薄弱章节',
    ],
  }
}
