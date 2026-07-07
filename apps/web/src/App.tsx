import './App.css'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { useCourseState } from './hooks/useCourseState'
import { SidebarNav } from './components/SidebarNav'
import { InspectorPanel } from './components/InspectorPanel'
import { CourseView } from './components/views/CourseView'
import { MaterialsView } from './components/views/MaterialsView'
import { AnalysisView } from './components/views/AnalysisView'
import { PlanView } from './components/views/PlanView'
import { ExecutionView } from './components/views/ExecutionView'
import { HistoryView } from './components/views/HistoryView'
import { AuthView } from './components/AuthView'

function MainApp() {
  const { user, loading: authLoading, logout } = useAuth()
  const {
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
  } = useCourseState()

  if (authLoading) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-card">
          <div className="auth-loading-radar" aria-hidden="true">
            <span className="auth-loading-ring" />
            <span className="auth-loading-ring" />
            <span className="auth-loading-dot" />
          </div>
          <strong>考点雷达正在启动</strong>
          <span>同步账号与复习工作台...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthView />
  }

  if (!activeCourse) {
    return (
      <div className="empty-state">
        <div className="empty-state-content">
          <div className="empty-state-mark" aria-hidden="true">
            <span />
          </div>
          <span className="empty-state-kicker">Workspace Empty</span>
          <h2>还没有课程</h2>
          <p>创建你的第一个复习课程开始使用</p>
          <div className="empty-state-actions">
            <button
              className="primary-btn"
              onClick={() => createCourse('我的第一个课程')}
            >
              + 新建课程
            </button>
          </div>
          <div className="empty-state-foot">
            <span>当前用户：{user.username}</span>
            <button className="link-btn" onClick={logout}>切换账号</button>
          </div>
        </div>
      </div>
    )
  }

  const course = activeCourse.course
  const materials = activeCourse.materials
  const tasks = activeCourse.tasks
  const plans = activeCourse.plans || []

  const readyMaterials = materials.filter((m: any) => m.status === 'ready').length
  const draftMaterials = materials.filter((m: any) => m.status === 'draft').length
  const progressPercent = materials.length === 0
    ? 0
    : Math.round((readyMaterials / materials.length) * 100)
  const doneTasks = tasks.filter((t: any) => t.done).length
  const taskProgressPercent = tasks.length === 0
    ? 0
    : Math.round((doneTasks / tasks.length) * 100)

  const renderView = () => {
    switch (activeTab) {
      case 'course':
        return <CourseView course={course} onChange={updateCourse} />
      case 'materials':
        return (
          <MaterialsView
            materials={materials}
            readyMaterials={readyMaterials}
            draftMaterials={draftMaterials}
            parseProgress={null}
            onAddMaterialWithFile={(_category, fileName) =>
              addMaterial({ title: fileName, category: _category, status: 'draft', format: 'PDF' })
            }
            onUploadFile={(_file, _category) => {}}
            onPromote={(id) => updateMaterial(id, { status: 'ready' })}
            onRemove={removeMaterial}
          />
        )
      case 'analysis':
        return <AnalysisView course={course} materials={materials} tasks={tasks} derived={derived} />
      case 'plan':
        return <PlanView plans={plans} derived={derived} onGenerate={reAnalyze} />
      case 'execution':
        return (
          <ExecutionView
            tasks={tasks}
            supplementList={derived.supplementList}
            onToggleTask={toggleTask}
            onAddTask={addTask}
            onRemoveTask={removeTask}
            onChangeOrder={setTaskOrder}
          />
        )
      case 'history':
        return <HistoryView courses={courses} activeCourseId={activeCourseId} onClear={() => setActiveTab('analysis')} />
      default:
        return null
    }
  }

  return (
    <div className="app-shell app-layout">
      <SidebarNav
        courses={courses}
        activeCourseId={activeCourseId}
        activeTab={activeTab}
        progressPercent={progressPercent}
        user={user}
        onTabChange={setActiveTab}
        onSwitchCourse={setActiveCourseId}
        onCreateCourse={() => createCourse('新课程')}
        onDeleteCourse={archiveCourse}
        onLogout={logout}
      />

      <div className="main-area">
        <header className="top-bar">
          <div className="top-bar-left">
            <span className="page-eyebrow-v6">
              <span className="eyebrow-dot"></span>
              {activeTab === 'analysis' && '智能分析'}
              {activeTab === 'plan' && '复习计划'}
              {activeTab === 'materials' && '资料管理'}
              {activeTab === 'execution' && '任务执行'}
              {activeTab === 'course' && '课程设置'}
              {activeTab === 'history' && '历史归档'}
            </span>
            <h1 className="page-title-v6">{course.name}</h1>
          </div>
          <div className="top-bar-right">
            <button className="ghost-btn" onClick={reAnalyze} disabled={loading}>
              {loading ? '分析中...' : '重新分析'}
            </button>
            <button className="ghost-btn" onClick={() => {
              if (confirm('确认归档当前课程？')) archiveCourse()
            }}>
              归档
            </button>
          </div>
        </header>

        {error && <div className="global-error">{error}</div>}

        <main className="workspace">{renderView()}</main>
      </div>

      <InspectorPanel
        course={course}
        derivedState={derived}
        analysisStatus={loading ? 'running' : 'idle'}
        taskProgressPercent={taskProgressPercent}
        onStartAnalysis={reAnalyze}
        onArchive={archiveCourse}
      />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  )
}

export default App
