import type { ReactNode } from 'react'
import type { AppTab, CourseRecord, AppUser } from '../types'
import { ThemeSwitcher } from './ThemeSwitcher'

type SidebarNavProps = {
  courses: CourseRecord[]
  activeCourseId: string
  activeTab: AppTab
  progressPercent: number
  user?: AppUser | null
  isGuest?: boolean
  onTabChange: (tab: AppTab) => void
  onSwitchCourse: (id: string) => void
  onCreateCourse: () => void
  onDeleteCourse: (id: string) => void
  onLogout?: () => void
}

const tabs: { value: AppTab; label: string; icon: ReactNode }[] = [
  {
    value: 'analysis',
    label: '分析结果',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M5.6 18.4l12.8-12.8" />
      </svg>
    ),
  },
  {
    value: 'plan',
    label: '复习计划',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12l4-4 4 4 6-6 4 4" />
        <path d="M3 19h18" />
      </svg>
    ),
  },
  {
    value: 'materials',
    label: '资料',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
  },
  {
    value: 'execution',
    label: '执行',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    value: 'course',
    label: '课程设置',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
  {
    value: 'history',
    label: '历史',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 8v4l3 3" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    ),
  },
]

export function SidebarNav({
  courses,
  activeCourseId,
  activeTab,
  progressPercent,
  user,
  isGuest,
  onTabChange,
  onSwitchCourse,
  onCreateCourse,
  onDeleteCourse,
  onLogout,
}: SidebarNavProps) {
  return (
    <nav className="sidebar-nav">
      <div className="sidebar-brand">
        <div className="brand-mark">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" />
          </svg>
        </div>
        <div className="brand-text">
          <span className="brand-name">考点雷达</span>
          <span className="brand-tag">Exam Radar</span>
        </div>
      </div>

      {isGuest && (
        <div className="guest-banner">
          <span className="guest-banner-icon">🚀</span>
          <div className="guest-banner-text">
            <span className="guest-banner-title">体验模式</span>
            <span className="guest-banner-desc">数据仅存本地浏览器</span>
          </div>
          {onLogout && (
            <button className="guest-banner-login" onClick={onLogout} title="注册/登录账号">
              登录
            </button>
          )}
        </div>
      )}

      <div className="course-selector">
        <div className="selector-label">
          <span>课程</span>
          <button type="button" onClick={onCreateCourse}>
            + 新建
          </button>
        </div>
        <div className="course-list">
          {(courses ?? []).map((course) => (
            <div
              key={course.id}
              className={`course-pill ${course.id === activeCourseId ? 'active' : ''}`}
              onClick={() => onSwitchCourse(course.id)}
            >
              <span className="course-dot"></span>
              <div className="course-copy">
                <span className="course-name">{course.course.name}</span>
                <span className="course-meta">
                  {course.materials.length} 资料 · {course.tasks.length} 任务
                </span>
              </div>
              {courses.length > 1 ? (
                <button
                  type="button"
                  className="course-remove"
                  onClick={(event) => {
                    event.stopPropagation()
                    onDeleteCourse(course.id)
                  }}
                  aria-label="删除课程"
                >
                  ×
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="nav-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={`nav-tab ${activeTab === tab.value ? 'active' : ''}`}
            onClick={() => onTabChange(tab.value)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="sidebar-footer">
        <ThemeSwitcher />
        <div className="progress-mini-header">
          <span>复习进度</span>
          <strong>{progressPercent}%</strong>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
        {user && (
          <div className={`user-card ${isGuest ? 'guest' : ''}`}>
            <div className="user-avatar">{isGuest ? '🚀' : user.username?.slice(0, 1).toUpperCase() || 'U'}</div>
            <div className="user-info">
              <span className="user-name">{isGuest ? '体验用户' : user.username}</span>
              <span className="user-email">{isGuest ? '点击右上角登录保存数据' : user.email}</span>
            </div>
            {onLogout && (
              <button className="user-logout" onClick={onLogout} title={isGuest ? '退出体验模式' : '退出登录'}>
                {isGuest ? '→' : '⎋'}
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
