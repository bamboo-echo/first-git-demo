export type PlanMode = 'sprint' | 'standard' | 'supplement'
export type TaskPriority = 'high' | 'medium'
export type MaterialCategory = 'exam' | 'ppt' | 'catalog' | 'scope' | 'notes' | 'exercises'
export type MaterialStatus = 'ready' | 'draft'
export type UserRole = 'user' | 'admin'

export type User = {
  id: string
  email: string
  username: string
  role: UserRole
  createdAt: string
}

export type Course = {
  id: string
  userId: string
  name: string
  examTime: string
  reviewHours: string
  goalMode: string
  examScope: string
  notes: string
  createdAt: string
  updatedAt: string
}

export type Material = {
  id: string
  courseId: string
  title: string
  description: string
  format: string
  category: MaterialCategory
  status: MaterialStatus
  fileName?: string
  fileUrl?: string
  uploadedAt: string
}

export type Task = {
  id: string
  courseId: string
  title: string
  detail: string
  duration: string
  done: boolean
  priority: TaskPriority
  mode: PlanMode
  order: number
  createdAt: string
}

export type PlanContent = {
  title: string
  description: string
  items: string[]
}

export type Analysis = {
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

export type Plan = {
  id: string
  courseId: string
  mode: PlanMode
  title: string
  description: string
  items: string[]
  generatedAt: string
}

export type HistoryRecord = {
  id: string
  userId: string
  courseId: string
  courseName: string
  archivedAt: string
  finalScore: number | null
  keyPointsCount: number
  tasksTotal: number
  tasksDone: number
  snapshotSummary: string[]
}

export type AuthResponse = {
  user: User
  token: string
}

export type ApiError = {
  statusCode: number
  message: string
  error: string
}
