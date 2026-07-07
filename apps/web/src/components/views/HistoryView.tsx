import type { CourseRecord } from '../../types'

type HistoryViewProps = {
  courses: CourseRecord[]
  activeCourseId: string
  onClear: () => void
}

export function HistoryView({ courses, activeCourseId, onClear }: HistoryViewProps) {
  const activeCourse = courses.find((course) => course.id === activeCourseId)
  const persistedRecords = activeCourse?.history || []
  const liveRecord = activeCourse?.analysis
    ? [{
      id: `${activeCourse.id}-live`,
      courseName: activeCourse.course.name,
      archivedAt: activeCourse.analysis.generatedAt,
      readiness: activeCourse.analysis.readinessScore,
      keyPointsCount: activeCourse.analysis.keyPoints.length,
      tasksTotal: activeCourse.tasks.length,
      tasksDone: activeCourse.tasks.filter((task) => task.done).length,
      snapshotSummary: activeCourse.analysis.summary,
      isLive: true,
    }]
    : []
  const records = [
    ...liveRecord,
    ...persistedRecords.map((record) => ({
      id: record.id,
      courseName: record.courseName,
      archivedAt: record.archivedAt,
      readiness: record.finalScore ?? 0,
      keyPointsCount: record.keyPointsCount,
      tasksTotal: record.tasksTotal,
      tasksDone: record.tasksDone,
      snapshotSummary: record.snapshotSummary || [],
      isLive: false,
    })),
  ]

  if (records.length === 0) {
    return (
      <div className="view-content">
        <header className="page-header">
          <span className="page-eyebrow">历史档案</span>
          <h1 className="page-title">战术档案库为空</h1>
          <p className="page-description">
            完成一次扫描后，课程会自动保存为历史快照，方便回看复习路径。
          </p>
        </header>
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h3>等待首次分析</h3>
          <p>点击顶部「重新分析」后，会自动生成当前课程的归档快照。</p>
        </div>
      </div>
    )
  }

  return (
    <div className="view-content">
      <header className="page-header">
        <span className="page-eyebrow">历史档案</span>
        <h1 className="page-title">每次分析都留下战术快照</h1>
        <p className="page-description">
          历史档案保留了每次分析的题型结构、考点识别和任务完成情况，方便回看复习路径。
        </p>
      </header>

      <section className="section">
        <div className="section-header">
          <h2 className="section-title">分析快照 · {records.length} 条</h2>
          <button type="button" className="text-button" onClick={onClear}>清空筛选</button>
        </div>
        <div className="history-list">
          {records.map((record) => {
            const date = new Date(record.archivedAt).toLocaleString('zh-CN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })
            return (
              <div className="history-item" key={record.id}>
                <div className="history-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div className="history-info">
                  <div className="history-title">{record.courseName}{record.isLive ? ' · 当前版本' : ''}</div>
                  <div className="history-meta">
                    {date} · 完成 {record.tasksDone}/{record.tasksTotal} · 识别 {record.keyPointsCount} 个考点
                  </div>
                  {record.snapshotSummary.length > 0 && (
                    <div className="history-summary">
                      {record.snapshotSummary.slice(0, 2).map((item, index) => (
                        <span key={index}>{item}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="history-score">
                  <div className="history-score-value">{record.readiness}<span style={{ color: 'var(--ink-muted)', fontSize: 13, fontWeight: 500 }}>%</span></div>
                  <div className="history-score-label">准备度</div>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
