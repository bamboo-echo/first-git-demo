import { useRef, useState } from 'react'
import type { MaterialItem, MaterialCategory } from '../../types'

type MaterialsViewProps = {
  materials: MaterialItem[]
  readyMaterials: number
  draftMaterials: number
  parseProgress: { file: string; percent: number; message: string } | null
  onAddMaterialWithFile: (category: MaterialCategory, fileName: string) => void
  onUploadFile: (file: File, category?: MaterialCategory) => void
  onPromote: (id: string) => void
  onRemove: (id: string) => void
}

const categoryOptions: { value: MaterialCategory; label: string }[] = [
  { value: 'exam', label: '历年真题' },
  { value: 'ppt', label: '老师课件' },
  { value: 'catalog', label: '教材目录' },
  { value: 'scope', label: '考试范围' },
  { value: 'notes', label: '课堂笔记' },
  { value: 'exercises', label: '指定习题' },
]

const categoryLabels: Record<MaterialCategory, string> = {
  exam: '真题',
  ppt: '课件',
  catalog: '目录',
  scope: '范围',
  notes: '笔记',
  exercises: '习题',
}

export function MaterialsView({
  materials,
  readyMaterials,
  draftMaterials,
  parseProgress,
  onAddMaterialWithFile,
  onUploadFile,
  onPromote,
  onRemove,
}: MaterialsViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedCategory, setSelectedCategory] = useState<MaterialCategory>('exam')
  const [isDragging, setIsDragging] = useState(false)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onUploadFile(file, selectedCategory)
      event.target.value = ''
    }
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files?.[0]
    if (file) {
      onUploadFile(file, selectedCategory)
    }
  }

  return (
    <div className="view-content">
      <header className="page-header">
        <span className="page-eyebrow">资料管理</span>
        <h1 className="page-title">把资料送进扫描台</h1>
        <p className="page-description">
          真题、课件、目录和笔记会进入同一个解析通道，系统会自动识别资料类型并归入对应层。
        </p>
      </header>

      <div
        className={`upload-area ${isDragging ? 'dragging' : ''}`}
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !parseProgress && fileInputRef.current?.click()}
      >
        <div className="upload-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <h3>{parseProgress ? '解析中…' : '拖拽文件或点击上传'}</h3>
        <p>支持 PDF / PPT / Word / 文本 / Markdown / 图片</p>
        {parseProgress ? (
          <div style={{ marginTop: 20, maxWidth: 360, margin: '20px auto 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: 'var(--ink-secondary)' }}>
              <span>{parseProgress.file}</span>
              <span style={{ fontWeight: 600 }}>{parseProgress.percent}%</span>
            </div>
            <div className="progress-bar" style={{ height: 6 }}>
              <div className="progress-fill" style={{ width: `${parseProgress.percent}%` }}></div>
            </div>
            <div style={{ marginTop: 6, fontSize: 11, color: 'var(--ink-muted)' }}>{parseProgress.message}</div>
          </div>
        ) : null}
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={handleFileChange}
          accept=".pdf,.ppt,.pptx,.doc,.docx,.txt,.md,.jpg,.jpeg,.png"
        />
      </div>

      <section className="section">
        <div className="section-header">
          <h2 className="section-title">分类</h2>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {categoryOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`secondary-button ${selectedCategory === opt.value ? '' : ''}`}
              style={{
                height: 28,
                padding: '0 10px',
                fontSize: 12,
                background: selectedCategory === opt.value ? 'var(--ink)' : 'var(--bg-elevated)',
                color: selectedCategory === opt.value ? 'var(--bg-elevated)' : 'var(--ink-secondary)',
                borderColor: selectedCategory === opt.value ? 'var(--ink)' : 'var(--border)',
              }}
              onClick={(e) => {
                e.stopPropagation()
                setSelectedCategory(opt.value)
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      {materials.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <h3>扫描台待机中</h3>
          <p>选择分类后上传资料，或直接把文件拖到上方区域开始扫描。</p>
        </div>
      ) : (
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">资料列表 · {readyMaterials} 就绪 / {draftMaterials} 待整理</h2>
          </div>
          <div className="materials-grid">
            {materials.map((item) => (
              <div className="material-item" key={item.id}>
                <div className="material-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div className="material-info">
                  <div className="material-name">{item.title}</div>
                  <div className="material-meta">{categoryLabels[item.category]} · {item.fileName || '草稿'}</div>
                </div>
                <span className={`status-badge ${item.status === 'ready' ? 'ready' : ''}`}>
                  {item.status === 'ready' ? '就绪' : '待整理'}
                </span>
                <div className="material-actions">
                  {item.status === 'draft' ? (
                    <button type="button" className="icon-button" onClick={() => onPromote(item.id)} title="标记就绪">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </button>
                  ) : null}
                  <button type="button" className="icon-button" onClick={() => onRemove(item.id)} title="移除">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <div className="section-header">
          <h2 className="section-title">快速添加</h2>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {categoryOptions.slice(0, 4).map((option) => (
            <button
              key={option.value}
              type="button"
              className="secondary-button"
              onClick={() => onAddMaterialWithFile(option.value, '')}
            >
              + {option.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
