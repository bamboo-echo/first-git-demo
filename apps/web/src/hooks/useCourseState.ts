import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import type { CourseState, AppTab, DerivedState } from '../types'
import { coursesApi, materialsApi, tasksApi, analysisApi, planApi, getStoredUser, historyApi } from '../utils/api'

export type CourseRecord = {
  id: string
  course: CourseState
  materials: any[]
  tasks: any[]
  analysis?: any
  plans?: any[]
  history?: any[]
  updatedAt: string
}

export function useCourseState() {
  const [courses, setCourses] = useState<CourseRecord[]>([])
  const [activeCourseId, setActiveCourseId] = useState<string>('')
  const [activeTab, setActiveTab] = useState<AppTab>('analysis')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isUpdatingRef = useRef(false)

  // 加载所有课程
  const refreshCourses = useCallback(async () => {
    try {
      setLoading(true)
      const user = getStoredUser()
      if (!user) {
        setCourses([])
        setLoading(false)
        return
      }
      const list = await coursesApi.list()
      if (list.length === 0) {
        // 自动创建一个演示课程
        const created = await coursesApi.create({
          name: '数据结构期末复习',
          examTime: '',
          reviewHours: '8',
          goalMode: '冲刺',
          examScope: '',
          notes: '',
        })
        const newList = [created]
        setCourses(newList.map((c: any) => ({ id: c.id, course: this_courseFromApi(c), materials: [], tasks: [], updatedAt: c.updatedAt })))
        setActiveCourseId(created.id)
        // 添加示例资料
        await materialsApi.create(created.id, {
          title: '2023 数据结构期末真题',
          description: '近 3 年期末考试真题合集',
          format: 'PDF',
          category: 'exam',
          status: 'ready',
        })
        await materialsApi.create(created.id, {
          title: '教材目录（前 8 章）',
          description: '数据结构教材目录',
          format: 'PDF',
          category: 'catalog',
          status: 'ready',
        })
        await materialsApi.create(created.id, {
          title: '老师 PPT（第 3 章）',
          description: '栈与队列',
          format: 'PPTX',
          category: 'ppt',
          status: 'draft',
        })
      } else {
        setCourses(list.map((c: any) => ({
          id: c.id,
          course: this_courseFromApi(c),
          materials: [],
          tasks: [],
          updatedAt: c.updatedAt,
        })))
        if (!activeCourseId) setActiveCourseId(list[0].id)
      }
    } catch (err: any) {
      setError(err.message || '加载课程失败')
    } finally {
      setLoading(false)
    }
  }, [activeCourseId])

  useEffect(() => {
    refreshCourses()
  }, [refreshCourses])

  // 加载当前课程的详细数据
  const refreshActive = useCallback(async () => {
    if (!activeCourseId) return
    try {
      const [detail, history] = await Promise.all([
        coursesApi.get(activeCourseId),
        historyApi.list(),
      ])
      setCourses((prev) =>
        prev.map((c) =>
          c.id === activeCourseId
            ? {
                ...c,
                course: this_courseFromApi(detail),
                materials: (detail.materials || []).map((m: any) => ({ ...m, status: m.status || 'ready' })),
                tasks: detail.tasks || [],
                analysis: detail.analyses?.[0] || c.analysis || null,
                plans: detail.plans || c.plans || [],
                history: (history || []).filter((item: any) => item.courseId === activeCourseId),
                updatedAt: detail.updatedAt,
              }
            : c,
        ),
      )
    } catch (err: any) {
      console.error('加载课程详情失败', err)
      setError(err.message || '加载课程详情失败')
    }
  }, [activeCourseId])

  useEffect(() => {
    if (activeCourseId) refreshActive()
  }, [activeCourseId, refreshActive])

  // 当前课程
  const activeCourse = useMemo(
    () => courses.find((c) => c.id === activeCourseId) || null,
    [courses, activeCourseId],
  )

  // 派生数据
  const derived: DerivedState = useMemo(() => {
    if (!activeCourse) {
      return {
        questionTypes: [],
        keyPoints: [],
        evidence: [],
        readinessScore: 0,
        supplementList: [],
        summary: [],
      }
    }
    const a = activeCourse.analysis
    const toStringArray = (arr: any): string[] => {
      if (!Array.isArray(arr)) return []
      return arr.map((item) => (typeof item === 'string' ? item : item?.title || String(item))).filter(Boolean)
    }
    const summary = Array.isArray(a?.summary) ? toStringArray(a.summary) : []
    return {
      questionTypes: toStringArray(a?.questionTypes),
      keyPoints: toStringArray(a?.keyPoints),
      evidence: toStringArray(a?.evidence),
      readinessScore: typeof a?.readinessScore === 'number' ? a.readinessScore : 0,
      supplementList: toStringArray(a?.supplementList),
      summary,
    }
  }, [activeCourse])

  // ===== 操作 =====

  const createCourse = useCallback(async (name: string) => {
    const created = await coursesApi.create({ name, reviewHours: '8', goalMode: '冲刺' })
    setCourses((prev) => [...prev, { id: created.id, course: this_courseFromApi(created), materials: [], tasks: [], updatedAt: created.updatedAt }])
    setActiveCourseId(created.id)
    return created
  }, [])

  const archiveCourse = useCallback(async (id?: string) => {
    const targetId = id || activeCourseId
    if (!targetId) return
    try {
      setError(null)
      await coursesApi.delete(targetId)
      setCourses((prev) => prev.filter((c) => c.id !== targetId))
      setActiveCourseId((_prev) => {
        const remaining = courses.filter((c) => c.id !== targetId)
        return remaining[0]?.id || ''
      })
    } catch (err: any) {
      setError(err.message || '归档课程失败')
    }
  }, [activeCourseId, courses])

  const updateCourse = useCallback(async (patch: Partial<CourseState>) => {
    if (!activeCourseId) return
    isUpdatingRef.current = true
    try {
      setError(null)
      const updated = await coursesApi.update(activeCourseId, patch)
      setCourses((prev) =>
        prev.map((c) => (c.id === activeCourseId ? { ...c, course: this_courseFromApi(updated), updatedAt: updated.updatedAt } : c)),
      )
    } catch (err: any) {
      setError(err.message || '更新课程失败')
    } finally {
      setTimeout(() => { isUpdatingRef.current = false }, 100)
    }
  }, [activeCourseId])

  const addMaterial = useCallback(async (data: any) => {
    if (!activeCourseId) return
    const created = await materialsApi.create(activeCourseId, data)
    setCourses((prev) =>
      prev.map((c) => (c.id === activeCourseId ? { ...c, materials: [created, ...c.materials] } : c)),
    )
    return created
  }, [activeCourseId])

  const updateMaterial = useCallback(async (id: string, patch: any) => {
    if (!activeCourseId) return
    const updated = await materialsApi.update(activeCourseId, id, patch)
    setCourses((prev) =>
      prev.map((c) => (c.id === activeCourseId ? { ...c, materials: c.materials.map((m) => (m.id === id ? updated : m)) } : c)),
    )
  }, [activeCourseId])

  const removeMaterial = useCallback(async (id: string) => {
    if (!activeCourseId) return
    await materialsApi.delete(activeCourseId, id)
    setCourses((prev) =>
      prev.map((c) => (c.id === activeCourseId ? { ...c, materials: c.materials.filter((m) => m.id !== id) } : c)),
    )
  }, [activeCourseId])

  const addTask = useCallback(async (data: any) => {
    if (!activeCourseId) return
    const created = await tasksApi.create(activeCourseId, data)
    setCourses((prev) =>
      prev.map((c) => (c.id === activeCourseId ? { ...c, tasks: [...c.tasks, created] } : c)),
    )
  }, [activeCourseId])

  const setTaskOrder = useCallback(async (id: string, order: number) => {
    if (!activeCourseId) return
    const updated = await tasksApi.update(activeCourseId, id, { order })
    setCourses((prev) =>
      prev.map((c) => (c.id === activeCourseId ? { ...c, tasks: c.tasks.map((t) => (t.id === id ? updated : t)) } : c)),
    )
  }, [activeCourseId])

  const toggleTask = useCallback(async (id: string) => {
    if (!activeCourseId) return
    const updated = await tasksApi.toggle(activeCourseId, id)
    setCourses((prev) =>
      prev.map((c) => (c.id === activeCourseId ? { ...c, tasks: c.tasks.map((t) => (t.id === id ? updated : t)) } : c)),
    )
  }, [activeCourseId])

  const removeTask = useCallback(async (id: string) => {
    if (!activeCourseId) return
    await tasksApi.delete(activeCourseId, id)
    setCourses((prev) =>
      prev.map((c) => (c.id === activeCourseId ? { ...c, tasks: c.tasks.filter((t) => t.id !== id) } : c)),
    )
  }, [activeCourseId])

  const reAnalyze = useCallback(async () => {
    if (!activeCourseId) return
    setLoading(true)
    setError(null)
    try {
      const result = await analysisApi.trigger(activeCourseId)
      setCourses((prev) =>
        prev.map((c) => (c.id === activeCourseId ? { ...c, analysis: result } : c)),
      )
      await planApi.generate(activeCourseId)
      await refreshActive()
    } catch (err: any) {
      setError(err.message || '分析失败')
    } finally {
      setLoading(false)
    }
  }, [activeCourseId, refreshActive])

  const generatePlans = useCallback(async () => {
    if (!activeCourseId) return
    const plans = await planApi.generate(activeCourseId)
    setCourses((prev) =>
      prev.map((c) => (c.id === activeCourseId ? { ...c, plans } : c)),
    )
  }, [activeCourseId])

  return {
    courses,
    activeCourse,
    activeCourseId,
    setActiveCourseId,
    activeTab,
    setActiveTab,
    loading,
    error,
    derived,
    createCourse,
    archiveCourse,
    updateCourse,
    addMaterial,
    updateMaterial,
    removeMaterial,
    addTask,
    setTaskOrder,
    toggleTask,
    removeTask,
    reAnalyze,
    generatePlans,
    refreshActive,
  }
}

function this_courseFromApi(c: any): CourseState {
  return {
    name: c.name,
    examTime: c.examTime || '',
    reviewHours: c.reviewHours || '8',
    goalMode: c.goalMode || '冲刺',
    examScope: c.examScope || '',
    notes: c.notes || '',
  }
}
