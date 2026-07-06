// 考点雷达前端类型定义
// 与后端 API 保持一致

export type PlanMode = 'sprint' | 'standard' | 'supplement'
export type TaskPriority = 'high' | 'medium'
export type MaterialCategory = 'exam' | 'ppt' | 'catalog' | 'scope' | 'notes' | 'exercises'
export type MaterialStatus = 'ready' | 'draft'
export type UserRole = 'user' | 'admin'

export type AppUser = {
  id: string
  email: string
  username: string
  role: UserRole
  createdAt: string
}

export type CourseState = {
  name: string
  examTime: string
  reviewHours: string
  goalMode: string
  examScope: string
  notes: string
}

export type Task = {
  id: string
  title: string
  detail: string
  duration: string
  done: boolean
  priority: TaskPriority
  mode: PlanMode
  order: number
}

export type MaterialItem = {
  id: string
  title: string
  description: string
  format: string
  category: MaterialCategory
  status: MaterialStatus
  fileName?: string
  fileUrl?: string
  uploadedAt?: string
}

export type PlanContent = {
  title: string
  description: string
  items: string[]
}

export type DerivedState = {
  questionTypes: string[]
  keyPoints: string[]
  evidence: string[]
  supplementList: string[]
  summary: string[]
  readinessScore: number
}

export type AnalysisRecord = {
  id: string
  courseId: string
  questionTypes: string[]
  keyPoints: string[]
  evidence: string[]
  readinessScore: number
  supplementList: string[]
  summary: string[]
  aiProvider: 'local' | 'openai' | 'deepseek'
  generatedAt: string
}

export type PlanRecord = {
  id: string
  courseId: string
  mode: PlanMode
  title: string
  description: string
  items: string[]
  generatedAt: string
}

export type AnalysisStatus = 'idle' | 'running' | 'ready'

export type AppTab = 'course' | 'materials' | 'analysis' | 'plan' | 'execution' | 'history'

export type CourseRecord = {
  id: string
  course: CourseState
  materials: MaterialItem[]
  tasks: Task[]
  analysis?: AnalysisRecord
  plans?: PlanRecord[]
  updatedAt: string
}
