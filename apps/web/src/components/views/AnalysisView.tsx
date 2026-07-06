import type { CourseState, MaterialItem, Task, DerivedState } from '../../types'

type AnalysisViewProps = {
  course: CourseState
  materials: MaterialItem[]
  tasks: Task[]
  derived: DerivedState
}

function RadarDisplay({ targets = 6 }: { targets?: number }) {
  const targetPositions = [
    { top: '25%', left: '60%' },
    { top: '35%', left: '30%' },
    { top: '55%', left: '70%' },
    { top: '65%', left: '25%' },
    { top: '45%', left: '50%' },
    { top: '70%', left: '55%' },
  ]

  return (
    <div className="radar-display">
      <div className="radar-grid"></div>
      <div className="radar-ring"></div>
      <div className="radar-ring"></div>
      <div className="radar-ring"></div>
      <div className="radar-ring"></div>
      <div className="radar-sweep"></div>
      <div className="radar-core"></div>
      {targetPositions.slice(0, targets).map((pos, idx) => (
        <div
          key={idx}
          className="radar-target"
          style={{
            top: pos.top,
            left: pos.left,
            animationDelay: `${idx * 0.3}s`,
          }}
        ></div>
      ))}
    </div>
  )
}

export function AnalysisView({ course: _course, materials, tasks, derived }: AnalysisViewProps) {
  const questionTypes = derived.questionTypes ?? []
  const keyPoints = derived.keyPoints ?? []
  const evidence = derived.evidence ?? []
  const readinessScore = derived.readinessScore ?? 0

  const readyCount = materials.filter((m) => m.status === 'ready').length
  const keyPointsCount = keyPoints.length
  const pendingTasks = tasks.filter((t) => !t.done).length

  return (
    <div className="view-content">
      <header className="analysis-hero-v6">
        <div className="animate-in">
          <span className="page-eyebrow-v6">
            <span className="eyebrow-dot"></span>
            智能分析已就绪
          </span>
        </div>

        <div className="animate-in animate-in-delay-1">
          <h1 className="hero-title-v6">
            先打中
            <span className="gradient-text-v6"> 最可能考 </span>
            的部分
          </h1>
        </div>

        <div className="animate-in animate-in-delay-2">
          <p className="hero-description-v6">
            结合资料密度、题型分布和剩余任务，当前最值得优先覆盖的是高频热点与题型命中区。
          </p>
        </div>

        <div className="hero-main-v6 animate-in animate-in-delay-3">
          <div className="hero-radar-wrapper-v6">
            <RadarDisplay targets={Math.min(keyPointsCount, 6)} />
          </div>

          <div className="hero-stats-v6">
            <div className="stat-card-v6 stat-large-v6">
              <span className="stat-label-v6">准备度</span>
              <span className="stat-value-v6 stat-accent-v6">
                {readinessScore}
                <span className="stat-unit-v6">%</span>
              </span>
            </div>
            <div className="stat-row-v6">
              <div className="stat-card-v6">
                <span className="stat-label-v6">识别考点</span>
                <span className="stat-value-v6">{keyPointsCount}<span className="stat-unit-v6">个</span></span>
              </div>
              <div className="stat-card-v6">
                <span className="stat-label-v6">覆盖资料</span>
                <span className="stat-value-v6">{readyCount}<span className="stat-unit-v6">/{materials.length}</span></span>
              </div>
            </div>
            <div className="stat-card-v6">
              <span className="stat-label-v6">待完成任务</span>
              <span className="stat-value-v6">{pendingTasks}<span className="stat-unit-v6">/{tasks.length}</span></span>
            </div>
          </div>
        </div>
      </header>

      <section className="section animate-in animate-in-delay-2">
        <div className="section-header">
          <h2 className="section-title">题型结构</h2>
        </div>
        <div className="data-list">
          {questionTypes.length === 0 ? (
            <div className="data-row">
              <span className="data-row-rank">—</span>
              <span style={{ color: 'var(--ink-muted)' }}>暂无题型数据</span>
            </div>
          ) : (
            questionTypes.map((qt: string, idx: number) => {
              const match = qt.match(/(\d+)%/)
              const percent = match ? Number.parseInt(match[1], 10) : 0
              const name = qt.replace(/\s*\d+%/, '')
              return (
                <div key={qt} className="data-row">
                  <span className="data-row-rank">{(idx + 1).toString().padStart(2, '0')}</span>
                  <span className="data-row-name">{name}</span>
                  <div className="data-row-bar">
                    <div className="data-row-bar-fill" style={{ width: `${percent}%` }}></div>
                  </div>
                  <span className="data-row-value">{percent}%</span>
                </div>
              )
            })
          )}
        </div>
      </section>

      <section className="section animate-in animate-in-delay-3">
        <div className="section-header">
          <h2 className="section-title">高频考点</h2>
          <span className="section-action">基于 {materials.length} 份资料</span>
        </div>
        <div className="data-list">
          {keyPoints.length === 0 ? (
            <div className="data-row">
              <span className="data-row-rank">—</span>
              <span style={{ color: 'var(--ink-muted)' }}>暂无考点数据</span>
            </div>
          ) : (
            keyPoints.slice(0, 6).map((kp: string, idx: number) => {
              const freq = Math.max(20, 95 - idx * 12)
              return (
                <div key={kp} className="data-row">
                  <span className="data-row-rank">{(idx + 1).toString().padStart(2, '0')}</span>
                  <span className="data-row-name">{kp}</span>
                  <div className="data-row-bar">
                    <div className="data-row-bar-fill" style={{ width: `${freq}%` }}></div>
                  </div>
                  <span className="data-row-value">{freq}</span>
                </div>
              )
            })
          )}
        </div>
      </section>

      <section className="section animate-in animate-in-delay-4">
        <div className="section-header">
          <h2 className="section-title">来源依据</h2>
        </div>
        <ul className="summary-list">
          {evidence.length === 0 ? (
            <li>
              <span>暂无来源依据，建议先上传资料。</span>
            </li>
          ) : (
            evidence.map((src: string, idx: number) => (
              <li key={`${idx}-${src.slice(0, 8)}`}>
                <span>{src}</span>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  )
}
