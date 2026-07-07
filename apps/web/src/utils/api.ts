// 考点雷达 API 客户端
// 统一管理所有后端 API 调用 + JWT 认证

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:4000'

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: any
  token?: string
  headers?: Record<string, string>
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

export async function api<T = any>(path: string, opts: RequestOptions = {}): Promise<T> {
  const token = opts.token || getToken()
  const res = await fetch(`${API_BASE}${path}`, {
    method: opts.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })

  const contentType = res.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await res.json() : await res.text()

  if (!res.ok) {
    const message = (data && (data.message || data.error)) || `请求失败 ${res.status}`
    throw new ApiError(res.status, Array.isArray(message) ? message.join('; ') : message, data)
  }
  return data as T
}

// === Auth ===
export const authApi = {
  register: (data: { email: string; username: string; password: string }) =>
    api<{ token: string; user: any }>('/api/auth/register', { method: 'POST', body: data }),
  login: (data: { email: string; password: string }) =>
    api<{ token: string; user: any }>('/api/auth/login', { method: 'POST', body: data }),
  forgotPassword: (data: { email: string }) =>
    api<{ success: boolean; message: string; resetUrl?: string; expiresAt?: string }>('/api/auth/forgot-password', { method: 'POST', body: data }),
  resetPassword: (data: { token: string; password: string }) =>
    api<{ success: boolean; message: string }>('/api/auth/reset-password', { method: 'POST', body: data }),
  startOAuth: (provider: 'wechat' | 'google' | 'apple') =>
    api<{ configured: boolean; provider: string; url?: string; state?: string; message?: string }>('/api/auth/oauth/start', { method: 'POST', body: { provider } }),
  me: () => api<any>('/api/auth/me'),
}

// === Courses ===
export const coursesApi = {
  list: () => api<any[]>('/api/courses'),
  get: (id: string) => api<any>(`/api/courses/${id}`),
  create: (data: any) => api<any>('/api/courses', { method: 'POST', body: data }),
  update: (id: string, data: any) => api<any>(`/api/courses/${id}`, { method: 'PUT', body: data }),
  delete: (id: string) => api<{ success: boolean }>(`/api/courses/${id}`, { method: 'DELETE' }),
}

// === Materials ===
export const materialsApi = {
  list: (courseId: string) => api<any[]>(`/api/courses/${courseId}/materials`),
  create: (courseId: string, data: any) =>
    api<any>(`/api/courses/${courseId}/materials`, { method: 'POST', body: data }),
  update: (courseId: string, id: string, data: any) =>
    api<any>(`/api/courses/${courseId}/materials/${id}`, { method: 'PUT', body: data }),
  delete: (courseId: string, id: string) =>
    api<{ success: boolean }>(`/api/courses/${courseId}/materials/${id}`, { method: 'DELETE' }),
}

// === Tasks ===
export const tasksApi = {
  list: (courseId: string) => api<any[]>(`/api/courses/${courseId}/tasks`),
  create: (courseId: string, data: any) =>
    api<any>(`/api/courses/${courseId}/tasks`, { method: 'POST', body: data }),
  update: (courseId: string, id: string, data: any) =>
    api<any>(`/api/courses/${courseId}/tasks/${id}`, { method: 'PUT', body: data }),
  toggle: (courseId: string, id: string) =>
    api<any>(`/api/courses/${courseId}/tasks/${id}/toggle`, { method: 'PUT' }),
  delete: (courseId: string, id: string) =>
    api<{ success: boolean }>(`/api/courses/${courseId}/tasks/${id}`, { method: 'DELETE' }),
}

// === Analysis ===
export const analysisApi = {
  trigger: (courseId: string) =>
    api<any>(`/api/courses/${courseId}/analysis`, { method: 'POST' }),
  latest: (courseId: string) => api<any | null>(`/api/courses/${courseId}/analysis/latest`),
  history: (courseId: string) => api<any[]>(`/api/courses/${courseId}/analysis`),
}

// === Plan ===
export const planApi = {
  generate: (courseId: string) =>
    api<any[]>(`/api/courses/${courseId}/plans`, { method: 'POST' }),
  list: (courseId: string) => api<any[]>(`/api/courses/${courseId}/plans`),
}

// === History ===
export const historyApi = {
  list: () => api<any[]>('/api/history'),
}

// === Health ===
export const healthApi = {
  check: () => api<any>('/api/health'),
}

export { ApiError, API_BASE }
