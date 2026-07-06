import type { Task } from '../../types'

type ExecutionViewProps = {
  tasks: Task[]
  supplementList: string[]
  onToggleTask: (id: string) => void
}

export function ExecutionView({ tasks, supplementList, onToggleTask }: ExecutionViewProps) {
  const completed = tasks.filter((t) => t.done).length
  const total = tasks.length
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100)

  return (
    <div className="view-content">
      <header className="page-header">
        <span className="page-eyebrow">执行清单</span>
        <h1 className="page-title">把今天真正要做的事钉在前面</h1>
        <p className="page-description">
          优先处理高频热点和未完成任务，补全区只保留还没覆盖到的内容。
        </p>
      </header>

      <section className="section">
        <div className="section-header">
          <h2 className="section-title">今日任务</h2>
          <span className="section-action">
            {completed} / {total} · {percent}%
          </span>
        </div>
        <div className="progress-bar" style={{ height: 4, marginBottom: 8 }}>
          <div className="progress-fill" style={{ width: `${percent}%` }}></div>
        </div>
        <div className="tasks-list">
          {tasks.length === 0 ? (
            <div className="data-row">
              <span className="data-row-rank">—</span>
              <span style={{ color: 'var(--ink-muted)' }}>暂无任务</span>
            </div>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className={`task-item ${task.done ? 'completed' : ''}`}>
                <button
                  type="button"
                  className={`task-checkbox ${task.done ? 'checked' : ''}`}
                  onClick={() => onToggleTask(task.id)}
                  aria-label={task.done ? '标记未完成' : '标记完成'}
                />
                <div className="task-content">
                  <div className="task-title">{task.title}</div>
                  <div className="task-meta">
                    <span className={`task-priority ${task.priority}`}>
                      {task.priority === 'high' ? '立即' : '次重点'}
                    </span>
                    <span>·</span>
                    <span>{task.duration}</span>
                    <span>·</span>
                    <span>{task.detail}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2 className="section-title">剩余补全</h2>
          <span className="section-action">{supplementList.length} 项</span>
        </div>
        <ul className="summary-list">
          {supplementList.length === 0 ? (
            <li>
              <span>已覆盖全部内容，可以专心完成核心任务。</span>
            </li>
          ) : (
            supplementList.map((item, idx) => (
              <li key={`${idx}-${item.slice(0, 8)}`}>
                <span>{item}</span>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  )
}
