import type { CourseState } from '../../types'

type CourseViewProps = {
  course: CourseState
  onChange: (field: keyof CourseState, value: string) => void
}

export function CourseView({ course, onChange }: CourseViewProps) {
  return (
    <div className="view-content">
      <header className="page-header">
        <span className="page-eyebrow">课程设置</span>
        <h1 className="page-title">{course.name || '未命名课程'}</h1>
        <p className="page-description">
          设置课程基本信息，雷达系统将根据这些参数调整分析策略和复习优先级。
        </p>
      </header>

      <section className="form-card">
        <div className="form-card-header">
          <h3>基本信息</h3>
          <p>课程名称和考试时间</p>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="course-name">课程名称</label>
          <input
            id="course-name"
            className="form-input"
            value={course.name}
            onChange={(event) => onChange('name', event.target.value)}
            placeholder="例如：软件工程"
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="exam-time">考试时间</label>
          <input
            id="exam-time"
            className="form-input"
            type="datetime-local"
            value={course.examTime}
            onChange={(event) => onChange('examTime', event.target.value)}
          />
        </div>
      </section>

      <section className="form-card">
        <div className="form-card-header">
          <h3>复习目标</h3>
          <p>时间和目标模式设置</p>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="review-hours">剩余复习时长（小时）</label>
          <input
            id="review-hours"
            className="form-input"
            value={course.reviewHours}
            onChange={(event) => onChange('reviewHours', event.target.value)}
            placeholder="例如：8"
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="goal-mode">目标模式</label>
          <input
            id="goal-mode"
            className="form-input"
            value={course.goalMode}
            onChange={(event) => onChange('goalMode', event.target.value)}
            placeholder="不挂科 / 70分 / 90分+"
          />
        </div>
      </section>

      <section className="form-card">
        <div className="form-card-header">
          <h3>考试范围</h3>
          <p>告诉雷达哪些章节需要重点扫描</p>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="exam-scope">考试范围说明</label>
          <textarea
            id="exam-scope"
            className="form-textarea"
            value={course.examScope}
            onChange={(event) => onChange('examScope', event.target.value)}
            placeholder="例如：第一章到第五章，重点是第三章和第四章的案例分析部分..."
          />
          <div className="form-helper">越详细，分析越精准</div>
        </div>
      </section>

      <section className="form-card">
        <div className="form-card-header">
          <h3>补充说明</h3>
          <p>其他需要注意的事项</p>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="notes">备注信息</label>
          <textarea
            id="notes"
            className="form-textarea"
            value={course.notes}
            onChange={(event) => onChange('notes', event.target.value)}
            placeholder="例如：老师划了重点、往年真题重复率高..."
          />
        </div>
      </section>
    </div>
  )
}
