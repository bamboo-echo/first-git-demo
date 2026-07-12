// 考点雷达 API 客户端 - 纯前端 Mock 模式
// 使用 localStorage 持久化所有数据，无需后端
// 评委访问即可体验完整流程：注册 → 登录 → 创建课程 → 上传资料 → 分析 → 计划 → 执行

// ============ 工具函数 ============
const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms))
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36)
const now = () => new Date().toISOString()

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}
function write<T>(key: string, val: T) {
  localStorage.setItem(key, JSON.stringify(val))
}

// ============ 存储键 ============
const K = {
  users: 'kd_users',
  courses: 'kd_courses',
  materials: 'kd_materials',
  tasks: 'kd_tasks',
  analyses: 'kd_analyses',
  plans: 'kd_plans',
  history: 'kd_history',
}

// ============ 类型 ============
type User = { id: string; email: string; username: string; password: string; createdAt: string }
type Course = {
  id: string; userId: string; name: string; examTime: string; reviewHours: string;
  goalMode: string; examScope: string; notes: string; createdAt: string; updatedAt: string
}
type Material = {
  id: string; courseId: string; title: string; description: string; format: string;
  category: string; status: string; createdAt: string
}
type Task = {
  id: string; courseId: string; title: string; detail: string; duration: string;
  done: boolean; priority: 'high' | 'medium'; mode: 'sprint' | 'standard' | 'supplement';
  order: number; createdAt: string
}
type Analysis = {
  id: string; courseId: string; keyPoints: string[]; questionTypes: string[];
  evidence: string[]; supplementList: string[]; summary: string[];
  readinessScore: number; generatedAt: string
}
type Plan = { id: string; courseId: string; mode: 'sprint' | 'standard' | 'supplement'; title: string; description: string; items: string[]; createdAt: string }
type HistoryRecord = {
  id: string; userId: string; courseId: string; courseName: string;
  keyPointsCount: number; tasksTotal: number; tasksDone: number;
  snapshotSummary: string[]; createdAt: string
}

class ApiError extends Error {
  status: number
  data: any
  constructor(status: number, message: string, data?: any) {
    super(message)
    this.status = status
    this.data = data
  }
}

// ============ Token 管理 ============
export function getToken(): string | null {
  return localStorage.getItem('kaodian-token')
}
export function setToken(token: string) {
  localStorage.setItem('kaodian-token', token)
}
export function clearToken() {
  localStorage.removeItem('kaodian-token')
  localStorage.removeItem('kaodian-user')
}
export function getStoredUser() {
  const raw = localStorage.getItem('kaodian-user')
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}
export function setStoredUser(user: any) {
  localStorage.setItem('kaodian-user', JSON.stringify(user))
}

// 通用请求函数（保留兼容，但 mock 模式不使用）
export async function api<T = any>(_path: string, _opts: any = {}): Promise<T> {
  throw new ApiError(500, 'Mock 模式不支持直接调用 api()')
}

// ============ 简化分析引擎 ============
function generateKeyPoints(course: Course, materials: Material[]): string[] {
  // 基于课程名和资料生成考点
  const basePoints: Record<string, string[]> = {
    '数据结构': ['线性表的顺序与链式存储', '栈与队列的应用场景', '二叉树遍历（前/中/后/层序）', '图的遍历与最短路径', '排序算法复杂度对比', '哈希表与冲突处理', '递归与分治思想'],
    '软件工程': ['需求分析方法', '软件设计模式', '敏捷开发流程', '测试用例设计', '项目管理与估算', '软件维护与演化'],
    '操作系统': ['进程与线程区别', 'CPU 调度算法', '内存管理与虚拟内存', '文件系统结构', '死锁的预防与避免', 'I/O 管理与缓冲'],
    '计算机网络': ['OSI 七层模型', 'TCP 三次握手', 'HTTP 协议特性', 'IP 地址与子网划分', 'DNS 解析流程', '网络安全基础'],
    '数据库': ['关系代数运算', 'SQL 查询优化', '事务的 ACID 特性', '范式与反范式', '索引的原理与使用', '并发控制与锁'],
  }
  // 模糊匹配课程名
  let matched: string[] = []
  for (const key of Object.keys(basePoints)) {
    if (course.name.includes(key)) {
      matched = basePoints[key]
      break
    }
  }
  if (matched.length === 0) {
    matched = ['核心概念与定义', '关键公式与推导', '典型例题与解法', '常见易错点', '章节重点梳理', '综合应用题分析']
  }
  // 资料越多，覆盖度越高，但考点列表保持字符串数组
  return matched.slice(0, Math.max(4, Math.min(8, materials.length + 4)))
}

function generateQuestionTypes(course: Course): string[] {
  const name = course.name
  if (name.includes('数据结构') || name.includes('算法')) {
    return [
      '选择题 20%',
      '填空题 15%',
      '应用题 40%',
      '算法设计题 25%',
    ]
  }
  return [
    '选择题 30%',
    '填空题 20%',
    '简答题 30%',
    '应用题 20%',
  ]
}

function generateEvidence(materials: Material[]): string[] {
  const labels = materials.map((m) => `${m.title}（${m.category}）`)
  return labels.length > 0 ? labels : ['系统默认考点库']
}

function generateSupplementList(course: Course): string[] {
  const scope = course.examScope || ''
  if (!scope) return ['完善考试范围说明', '补充历年真题', '整理课堂笔记']
  return scope.split(/[,，;；\n]/).filter((s) => s.trim()).slice(0, 5).map((s) => `补充：${s.trim()}`)
}

function generateReadinessScore(materials: Material[], keyPoints: string[]): number {
  const readyCount = materials.filter((m) => m.status === 'ready').length
  const materialScore = Math.min(40, readyCount * 10)
  const coverageScore = Math.min(40, keyPoints.length * 5)
  return Math.min(95, 20 + materialScore + coverageScore)
}

function generatePlans(course: Course, keyPoints: string[]): Plan[] {
  const top3 = keyPoints.slice(0, 3)
  const top5 = keyPoints.slice(0, 5)
  const all = keyPoints
  const mk = (mode: 'sprint' | 'standard' | 'supplement', points: string[], makeItem: (p: string, i: number) => string, title: string, description: string): Plan => ({
    id: uid(), courseId: course.id, mode, title, description, createdAt: now(),
    items: points.map((p, i) => makeItem(p, i)),
  })
  return [
    mk('sprint', top3, (p) => `极速攻克：${p}`, '极速版 · 2小时突击', '时间紧张时，优先拿下最高频、性价比最高的考点'),
    mk('standard', top5, (p) => `系统精修：${p}`, '标准版 · 1天系统复习', '按章节顺序系统梳理，建立完整知识框架'),
    mk('supplement', all, (p) => `查漏补缺：${p}`, '补充版 · 查漏补缺', '完成核心复习后，补齐次重点与易遗漏点'),
  ]
}

// ============ Auth API ============
export const authApi = {
  async register(data: { email: string; username: string; password: string }) {
    await delay()
    const users = read<User[]>(K.users, [])
    if (users.find((u) => u.email === data.email)) {
      throw new ApiError(409, '该邮箱已被注册')
    }
    const user: User = {
      id: uid(), email: data.email, username: data.username,
      password: data.password, createdAt: now(),
    }
    users.push(user)
    write(K.users, users)
    const token = `mock.${user.id}.${uid()}`
    setToken(token)
    setStoredUser({ id: user.id, email: user.email, username: user.username })
    return { token, user: { id: user.id, email: user.email, username: user.username } }
  },
  async login(data: { email: string; password: string }) {
    await delay()
    const users = read<User[]>(K.users, [])
    const user = users.find((u) => u.email === data.email)
    if (!user || user.password !== data.password) {
      throw new ApiError(401, '邮箱或密码错误')
    }
    const token = `mock.${user.id}.${uid()}`
    setToken(token)
    setStoredUser({ id: user.id, email: user.email, username: user.username })
    return { token, user: { id: user.id, email: user.email, username: user.username } }
  },
  async forgotPassword(_data: { email: string }) {
    await delay()
    return {
      success: true,
      message: '重置链接已生成（演示模式，请直接用原密码登录）',
      resetUrl: '#/reset?demo=1',
      expiresAt: now(),
    }
  },
  async resetPassword(_data: { token: string; password: string }) {
    await delay()
    return { success: true, message: '密码已重置（演示模式）' }
  },
  async startOAuth(provider: string) {
    await delay()
    return {
      configured: false, provider,
      message: `${provider} 登录暂未配置（演示模式请用邮箱注册）`,
    }
  },
  async me() {
    await delay(80)
    const user = getStoredUser()
    if (!user) throw new ApiError(401, '未登录')
    return user
  },
}

// ============ Courses API ============
function courseFromApi(c: Course) {
  return {
    id: c.id, name: c.name, examTime: c.examTime, reviewHours: c.reviewHours,
    goalMode: c.goalMode, examScope: c.examScope, notes: c.notes,
    createdAt: c.createdAt, updatedAt: c.updatedAt, userId: c.userId,
  }
}

export const coursesApi = {
  async list() {
    await delay()
    const user = getStoredUser()
    if (!user) return []
    const all = read<Course[]>(K.courses, [])
    return all.filter((c) => c.userId === user.id).map(courseFromApi)
  },
  async get(id: string) {
    await delay()
    const all = read<Course[]>(K.courses, [])
    const c = all.find((x) => x.id === id)
    if (!c) throw new ApiError(404, '课程不存在')
    const materials = read<Material[]>(K.materials, []).filter((m) => m.courseId === id)
    const tasks = read<Task[]>(K.tasks, []).filter((t) => t.courseId === id).sort((a, b) => a.order - b.order)
    const analyses = read<Analysis[]>(K.analyses, []).filter((a) => a.courseId === id)
      .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
    const plans = read<Plan[]>(K.plans, []).filter((p) => p.courseId === id)
    return {
      ...courseFromApi(c),
      materials,
      tasks,
      analyses,
      plans,
    }
  },
  async create(data: any) {
    await delay()
    const user = getStoredUser()
    if (!user) throw new ApiError(401, '未登录')
    const all = read<Course[]>(K.courses, [])
    const c: Course = {
      id: uid(), userId: user.id,
      name: data.name || '未命名课程',
      examTime: data.examTime || '', reviewHours: data.reviewHours || '8',
      goalMode: data.goalMode || '冲刺', examScope: data.examScope || '',
      notes: data.notes || '', createdAt: now(), updatedAt: now(),
    }
    all.push(c)
    write(K.courses, all)
    return courseFromApi(c)
  },
  async update(id: string, data: any) {
    await delay()
    const all = read<Course[]>(K.courses, [])
    const idx = all.findIndex((x) => x.id === id)
    if (idx < 0) throw new ApiError(404, '课程不存在')
    all[idx] = { ...all[idx], ...data, updatedAt: now() }
    write(K.courses, all)
    return courseFromApi(all[idx])
  },
  async delete(id: string) {
    await delay()
    const user = getStoredUser()
    // 删除前创建历史记录
    const courses = read<Course[]>(K.courses, [])
    const course = courses.find((c) => c.id === id)
    const materials = read<Material[]>(K.materials, []).filter((m) => m.courseId === id)
    const tasks = read<Task[]>(K.tasks, []).filter((t) => t.courseId === id)
    const analyses = read<Analysis[]>(K.analyses, []).filter((a) => a.courseId === id)
    if (course && user) {
      const history = read<HistoryRecord[]>(K.history, [])
      const latestAnalysis = analyses[0]
      history.push({
        id: uid(), userId: user.id, courseId: id, courseName: course.name,
        keyPointsCount: latestAnalysis?.keyPoints.length || 0,
        tasksTotal: tasks.length,
        tasksDone: tasks.filter((t) => t.done).length,
        snapshotSummary: latestAnalysis?.summary?.length
          ? latestAnalysis.summary.slice(0, 2)
          : [`${course.name} · ${materials.length} 份资料 · ${tasks.length} 个任务`],
        createdAt: now(),
      })
      write(K.history, history)
    }
    // 级联删除
    write(K.courses, courses.filter((c) => c.id !== id))
    write(K.materials, read<Material[]>(K.materials, []).filter((m) => m.courseId !== id))
    write(K.tasks, read<Task[]>(K.tasks, []).filter((t) => t.courseId !== id))
    write(K.analyses, read<Analysis[]>(K.analyses, []).filter((a) => a.courseId !== id))
    write(K.plans, read<Plan[]>(K.plans, []).filter((p) => p.courseId !== id))
    return { success: true }
  },
}

// ============ Materials API ============
export const materialsApi = {
  async list(courseId: string) {
    await delay()
    const all = read<Material[]>(K.materials, [])
    return all.filter((m) => m.courseId === courseId)
  },
  async create(courseId: string, data: any) {
    await delay()
    const all = read<Material[]>(K.materials, [])
    const m: Material = {
      id: uid(), courseId,
      title: data.title || '未命名资料',
      description: data.description || '',
      format: data.format || 'PDF',
      category: data.category || 'other',
      status: data.status || 'ready',
      createdAt: now(),
    }
    all.push(m)
    write(K.materials, all)
    return m
  },
  async update(courseId: string, id: string, data: any) {
    await delay()
    const all = read<Material[]>(K.materials, [])
    const idx = all.findIndex((m) => m.id === id && m.courseId === courseId)
    if (idx < 0) throw new ApiError(404, '资料不存在')
    all[idx] = { ...all[idx], ...data }
    write(K.materials, all)
    return all[idx]
  },
  async delete(courseId: string, id: string) {
    await delay()
    const all = read<Material[]>(K.materials, [])
    write(K.materials, all.filter((m) => !(m.id === id && m.courseId === courseId)))
    return { success: true }
  },
}

// ============ Tasks API ============
export const tasksApi = {
  async list(courseId: string) {
    await delay()
    const all = read<Task[]>(K.tasks, [])
    return all.filter((t) => t.courseId === courseId).sort((a, b) => a.order - b.order)
  },
  async create(courseId: string, data: any) {
    await delay()
    const all = read<Task[]>(K.tasks, [])
    const order = all.filter((t) => t.courseId === courseId).length + 1
    const t: Task = {
      id: uid(), courseId,
      title: data.title || '新任务',
      detail: data.detail || '',
      duration: data.duration || '30分钟',
      done: data.done ?? false,
      priority: data.priority || 'medium',
      order: data.order ?? order,
      mode: data.mode || 'standard',
      createdAt: now(),
    }
    all.push(t)
    write(K.tasks, all)
    return t
  },
  async update(courseId: string, id: string, data: any) {
    await delay()
    const all = read<Task[]>(K.tasks, [])
    const idx = all.findIndex((t) => t.id === id && t.courseId === courseId)
    if (idx < 0) throw new ApiError(404, '任务不存在')
    all[idx] = { ...all[idx], ...data }
    write(K.tasks, all)
    return all[idx]
  },
  async toggle(courseId: string, id: string) {
    await delay()
    const all = read<Task[]>(K.tasks, [])
    const idx = all.findIndex((t) => t.id === id && t.courseId === courseId)
    if (idx < 0) throw new ApiError(404, '任务不存在')
    all[idx].done = !all[idx].done
    write(K.tasks, all)
    return all[idx]
  },
  async delete(courseId: string, id: string) {
    await delay()
    const all = read<Task[]>(K.tasks, [])
    write(K.tasks, all.filter((t) => !(t.id === id && t.courseId === courseId)))
    return { success: true }
  },
}

// ============ Analysis API ============
export const analysisApi = {
  async trigger(courseId: string) {
    await delay(400)
    const courses = read<Course[]>(K.courses, [])
    const course = courses.find((c) => c.id === courseId)
    if (!course) throw new ApiError(404, '课程不存在')
    const materials = read<Material[]>(K.materials, []).filter((m) => m.courseId === courseId)
    const keyPoints = generateKeyPoints(course, materials)
    const questionTypes = generateQuestionTypes(course)
    const evidence = generateEvidence(materials)
    const supplementList = generateSupplementList(course)
    const readinessScore = generateReadinessScore(materials, keyPoints)
    const generatedAt = now()
    const analysis: Analysis = {
      id: uid(), courseId,
      keyPoints,
      questionTypes,
      evidence,
      supplementList,
      summary: [
        `基于 ${materials.length} 份资料，识别出 ${keyPoints.length} 个考点`,
        `当前准备度约 ${readinessScore}%，建议优先复习前 3 个高频考点`,
        `识别高频题型 ${questionTypes.length} 类，可作为复习方向参考`,
      ],
      readinessScore,
      generatedAt,
    }
    const all = read<Analysis[]>(K.analyses, [])
    all.push(analysis)
    write(K.analyses, all)
    // 同步生成三档计划
    const plans = generatePlans(course, keyPoints)
    const allPlans = read<Plan[]>(K.plans, [])
    write(K.plans, [...allPlans.filter((p) => p.courseId !== courseId), ...plans])
    // 同步生成任务（基于标准版计划）
    const stdPlan = plans.find((p) => p.mode === 'standard')
    if (stdPlan) {
      const allTasks = read<Task[]>(K.tasks, [])
      write(K.tasks, [
        ...allTasks.filter((t) => t.courseId !== courseId),
        ...stdPlan.items.map((item, i) => ({
          id: uid(), courseId, title: item, detail: '按规划完成对应考点复习',
          duration: '45分钟', done: false, priority: i < 2 ? 'high' : 'medium' as const,
          order: i + 1, mode: 'standard' as const, createdAt: now(),
        })),
      ])
    }
    return analysis
  },
  async latest(courseId: string) {
    await delay()
    const all = read<Analysis[]>(K.analyses, [])
    const list = all.filter((a) => a.courseId === courseId).sort((a, b) =>
      new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
    return list[0] || null
  },
  async history(courseId: string) {
    await delay()
    const all = read<Analysis[]>(K.analyses, [])
    return all.filter((a) => a.courseId === courseId).sort((a, b) =>
      new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
  },
}

// ============ Plan API ============
export const planApi = {
  async generate(courseId: string) {
    await delay(300)
    const courses = read<Course[]>(K.courses, [])
    const course = courses.find((c) => c.id === courseId)
    if (!course) throw new ApiError(404, '课程不存在')
    const analyses = read<Analysis[]>(K.analyses, [])
    const analysis = analyses.filter((a) => a.courseId === courseId)
      .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())[0]
    const keyPoints = analysis?.keyPoints || generateKeyPoints(course, [])
    const plans = generatePlans(course, keyPoints)
    const allPlans = read<Plan[]>(K.plans, [])
    write(K.plans, [...allPlans.filter((p) => p.courseId !== courseId), ...plans])
    return plans
  },
  async list(courseId: string) {
    await delay()
    const all = read<Plan[]>(K.plans, [])
    return all.filter((p) => p.courseId === courseId)
  },
}

// ============ History API ============
export const historyApi = {
  async list() {
    await delay()
    const user = getStoredUser()
    if (!user) return []
    const all = read<HistoryRecord[]>(K.history, [])
    return all.filter((h) => h.userId === user.id).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  },
}

// ============ Health API ============
export const healthApi = {
  async check() {
    await delay(50)
    return { status: 'ok', mode: 'frontend-mock', timestamp: now() }
  },
}

export { ApiError }
// 保留 API_BASE 兼容性（实际不使用）
const API_BASE = ''
export { API_BASE }
