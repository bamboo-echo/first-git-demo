import { useState } from 'react'
import type { PlanMode, DerivedState, PlanRecord } from '../../types'

type PlanViewProps = {
  plans: PlanRecord[]
  derived: DerivedState
  onGenerate: () => void
}

const modes: { value: PlanMode; label: string; desc: string; tag: string }[] = [
  { value: 'sprint', label: '极速版', desc: '时间紧张时优先覆盖最高收益考点', tag: '2 小时突击' },
  { value: 'standard', label: '标准版', desc: '时间充裕时按章节系统梳理', tag: '1 天系统' },
  { value: 'supplement', label: '补充版', desc: '完成核心后补齐次重点与易漏点', tag: '查漏补缺' },
]

const modeLabelMap: Record<PlanMode, string> = {
  sprint: '极速版',
  standard: '标准版',
  supplement: '补充版',
}

export function PlanView({ plans, derived, onGenerate }: PlanViewProps) {
  const [activeMode, setActiveMode] = useState<PlanMode>('sprint')
  const currentPlan = plans.find((p) => p.mode === activeMode)
  const currentMode = modes.find((m) => m.value === activeMode)

  return (
    <div className="view-content">
      <header className="page-header">
        <span className="page-eyebrow">战略规划</span>
        <h1 className="page-title">选一条最适合你的冲刺路线</h1>
        <p className="page-description">
          根据剩余时间和掌握程度，三种复习策略对应不同的优先级排序。切换模式可即时查看调整后的执行清单。
        </p>
      </header>

      <div className="plan-modes">
        {modes.map((mode, idx) => {
          const plan = plans.find((p) => p.mode === mode.value)
          const isActive = activeMode === mode.value
          return (
            <button
              key={mode.value}
              type="button"
              className={`plan-mode ${isActive ? 'active' : ''}`}
              onClick={() => setActiveMode(mode.value)}
              style={{ animationDelay: `${idx * 0.06}s` }}
            >
              <div className="plan-mode-head">
                <span className="plan-mode-index">{String(idx + 1).padStart(2, '0')}</span>
                <span className="plan-mode-tag">{mode.tag}</span>
              </div>
              <div className="plan-mode-body">
                <h3>{mode.label}</h3>
                <p>{mode.desc}</p>
              </div>
              {plan && <div className="plan-mode-foot">{plan.items.length} 步</div>}
            </button>
          )
        })}
      </div>

      {currentPlan ? (
        <section className="section plan-detail">
          <div className="section-header">
            <div>
              <h2 className="section-title">{currentPlan.title}</h2>
              <p className="section-subtitle">{currentPlan.description}</p>
            </div>
            <button type="button" className="text-button" onClick={onGenerate}>
              重新生成
            </button>
          </div>
          <div className="plan-recommendation">
            当前推荐：
            <strong>
              {derived.readinessScore < 45 || derived.summary.length <= 2
                ? '极速版'
                : derived.readinessScore >= 70 && derived.keyPoints.length >= 5
                  ? '补充版'
                  : '标准版'}
            </strong>
            <span> · 根据准备度与资料完整度自动判断</span>
          </div>
          <ol className="plan-steps">
            {currentPlan.items.map((item, idx) => (
              <li key={idx} className="plan-step">
                <span className="plan-step-num">{String(idx + 1).padStart(2, '0')}</span>
                <span className="plan-step-text">{item}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : (
        <section className="section">
          <div className="empty-card">
            <h3>还没有生成复习路线</h3>
            <p>点击下方按钮，基于当前课程和资料生成 3 条冲刺路线。</p>
            <button type="button" className="primary-btn" onClick={onGenerate}>
              生成复习路线
            </button>
          </div>
        </section>
      )}

      {derived.summary.length > 0 && (
        <section className="section course-summary">
          <h2 className="section-title">课程摘要</h2>
          <ul>
            {derived.summary.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
