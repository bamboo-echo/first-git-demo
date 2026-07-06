import type { DerivedState, CourseState, AnalysisStatus } from '../types'

type InspectorPanelProps = {
  course: CourseState
  derivedState: DerivedState
  taskProgressPercent: number
  onStartAnalysis: () => void
  onArchive: () => void
  analysisStatus: AnalysisStatus
}

export function InspectorPanel({
  course,
  derivedState,
  taskProgressPercent,
  onStartAnalysis,
  onArchive,
  analysisStatus,
}: InspectorPanelProps) {
  const keyPoints = derivedState.keyPoints ?? []
  const readiness = derivedState.readinessScore ?? 0
  const questionTypes = derivedState.questionTypes ?? []
  const topTypes = questionTypes.slice(0, 2)
  const topPoint = keyPoints[0] ?? '暂无考点'

  // 估算距考试天数
  const daysToExam = course.examTime
    ? Math.max(0, Math.ceil((new Date(course.examTime).getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
    : 30

  const ringRadius = 28
  const ringCircumference = 2 * Math.PI * ringRadius
  const ringOffset = ringCircumference * (1 - readiness / 100)

  return (
    <aside className="inspector-panel">
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#14b8a6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="inspector-block">
        <span className="inspector-eyebrow">当前焦点</span>
        <h2 className="inspector-headline">{topPoint}</h2>
        <p className="inspector-sub">系统判断本考点收益最高，建议立即安排 45 分钟进入第一轮复习。</p>

        <div className="countdown-row">
          <div className="countdown-ring">
            <svg className="countdown-svg" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r={ringRadius} className="ring-bg" />
              <circle
                cx="32"
                cy="32"
                r={ringRadius}
                className="ring-progress"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
              />
            </svg>
            <div className="countdown-center">{daysToExam}</div>
          </div>
          <div className="countdown-info">
            <div className="countdown-info-label">距考试</div>
            <div className="countdown-info-value">{daysToExam} 天</div>
          </div>
        </div>
      </div>

      <div className="inspector-block">
        <div className="inspector-block-title">
          <span>核心指标</span>
        </div>
        <div className="metric-tiles">
          <div className="metric-tile">
            <div className="metric-tile-label">准备度</div>
            <div className="metric-tile-value">
              {readiness}<span className="unit">%</span>
            </div>
          </div>
          <div className="metric-tile">
            <div className="metric-tile-label">核心考点</div>
            <div className="metric-tile-value">{keyPoints.length}</div>
          </div>
          <div className="metric-tile">
            <div className="metric-tile-label">高频题型</div>
            <div className="metric-tile-value">
              {topTypes[0]?.replace(/\s*\d+%/, '') ?? '—'}
            </div>
          </div>
          <div className="metric-tile">
            <div className="metric-tile-label">任务完成</div>
            <div className="metric-tile-value">
              {taskProgressPercent}<span className="unit">%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="inspector-block">
        <div className="inspector-block-title">
          <span>建议行动</span>
        </div>
        <div className="priority-item">
          <div className="priority-title">{topPoint}</div>
          <div className="priority-meta">
            <span>建议 45 分钟 · 题型命中度高</span>
            <span className="priority-tag">立即</span>
          </div>
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="primary-button"
            onClick={onStartAnalysis}
            disabled={analysisStatus === 'running'}
            style={{ flex: 1 }}
          >
            {analysisStatus === 'running' ? '扫描中' : '开始扫描'}
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={onArchive}
            style={{ flex: 1 }}
          >
            归档
          </button>
        </div>
      </div>

      <div className="inspector-block">
        <div className="inspector-block-title">
          <span>课程信息</span>
        </div>
        <div className="info-list">
          <div className="info-row">
            <span className="info-row-label">课程</span>
            <span className="info-row-value">{course.name || '未命名'}</span>
          </div>
          <div className="info-row">
            <span className="info-row-label">目标</span>
            <span className="info-row-value">{course.goalMode || '未设置'}</span>
          </div>
          <div className="info-row">
            <span className="info-row-label">复习时长</span>
            <span className="info-row-value">{course.reviewHours ? `${course.reviewHours} 小时` : '未设置'}</span>
          </div>
          <div className="info-row">
            <span className="info-row-label">考试时间</span>
            <span className="info-row-value">{course.examTime || '未设置'}</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
