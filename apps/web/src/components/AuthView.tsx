import { useMemo, useState, type FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'

function safeErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  return '操作失败'
}

type AuthViewProps = {
  onSuccess?: () => void
}

export function AuthView(_props: AuthViewProps) {
  const { login, register, forgotPassword, resetPassword, startOAuth } = useAuth()
  const initialResetToken = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return new URLSearchParams(window.location.search).get('resetToken') || ''
  }, [])
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>(initialResetToken ? 'reset' : 'login')
  const [email, setEmail] = useState('')
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetToken, setResetToken] = useState(initialResetToken)
  const [showPassword, setShowPassword] = useState(false)
  const [agreePolicy, setAgreePolicy] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const canSubmit = useMemo(() => {
    if (loading) return false
    if (mode === 'register' && !agreePolicy) return false
    if (mode === 'reset' && (!resetToken || password.length < 6 || password !== confirmPassword)) return false
    return true
  }, [agreePolicy, confirmPassword, loading, mode, password, resetToken])

  const handleModeChange = (nextMode: 'login' | 'register' | 'forgot' | 'reset') => {
    setMode(nextMode)
    setError(null)
    setNotice(null)
    setShowPassword(false)
    if (nextMode === 'login') setAgreePolicy(false)
    if (nextMode !== 'reset') setConfirmPassword('')
  }

  const handleSsoClick = async (provider: 'wechat' | 'google' | 'apple') => {
    setError(null)
    setNotice(null)
    try {
      const result = await startOAuth(provider)
      if (result.configured && result.url) {
        window.location.href = result.url
        return
      }
      setNotice(result.message || '当前环境尚未完成第三方登录配置')
    } catch (err) {
      setError(safeErrorMessage(err))
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (mode === 'register' && !agreePolicy) {
      setError('请先勾选并同意用户协议与隐私政策')
      return
    }

    setError(null)
    setNotice(null)
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else if (mode === 'register') {
        await register(email, nickname || email.split('@')[0], password)
      } else if (mode === 'forgot') {
        const result = await forgotPassword(email)
        setNotice(result.resetUrl ? `重置链接已生成：${result.resetUrl}` : result.message)
        setPassword('')
      } else {
        if (password !== confirmPassword) {
          setError('两次输入的密码不一致')
          return
        }
        const result = await resetPassword(resetToken, password)
        setNotice(result.message)
        setPassword('')
        setConfirmPassword('')
        handleModeChange('login')
      }
    } catch (err) {
      setError(safeErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-bg-orb auth-bg-orb-1" />
      <div className="auth-bg-orb auth-bg-orb-2" />

      <div className="auth-card">
        <div className="auth-secure-badge">
          <span className="auth-secure-dot" />
          安全登录
        </div>
        <div className="auth-brand">
          <div className="auth-logo">
            <span className="auth-logo-dot" />
            考点雷达
          </div>
          <p className="auth-tagline">先打中最可能考的部分</p>
        </div>

        <div className="auth-tabs" role="tablist" aria-label="账号入口切换">
          <button
            type="button"
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            role="tab"
            aria-selected={mode === 'login'}
            onClick={() => handleModeChange('login')}
          >
            登录
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
            role="tab"
            aria-selected={mode === 'register'}
            onClick={() => handleModeChange('register')}
          >
            注册
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="auth-field">
              <label htmlFor="auth-nickname">昵称</label>
              <input
                id="auth-nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="例如：高数冲刺生"
                autoComplete="username"
              />
              <p className="auth-helper">不填则默认使用邮箱前缀生成用户名</p>
            </div>
          )}
          {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
          <div className="auth-field">
            <label htmlFor="auth-email">邮箱</label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              aria-invalid={Boolean(error)}
              required
            />
          </div>
          )}
          {(mode === 'login' || mode === 'register' || mode === 'reset') && (
          <div className="auth-field">
            <div className="auth-label-row">
              <label htmlFor="auth-password">密码</label>
              {mode === 'login' ? (
                <button
                  type="button"
                  className="auth-inline-link"
                  onClick={() => handleModeChange('forgot')}
                >
                  忘记密码？
                </button>
              ) : mode === 'reset' ? (
                <span className="auth-helper-inline">设置新的登录密码</span>
              ) : (
                <span className="auth-helper-inline">至少 6 位</span>
              )}
            </div>
            <div className="auth-password-wrap">
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'register' ? '设置一个安全密码' : mode === 'reset' ? '输入新密码' : '请输入密码'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                minLength={mode === 'register' ? 6 : undefined}
                aria-invalid={Boolean(error)}
                required
              />
              <button
                type="button"
                className="auth-visibility-toggle"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? '隐藏密码' : '显示密码'}
                aria-pressed={showPassword}
              >
                {showPassword ? '隐藏' : '显示'}
              </button>
            </div>
          </div>
          )}

          {mode === 'reset' && (
            <>
              <div className="auth-field">
                <label htmlFor="auth-reset-token">重置令牌</label>
                <input
                  id="auth-reset-token"
                  type="text"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value.trim())}
                  placeholder="粘贴邮件中的重置令牌"
                  required
                />
              </div>
              <div className="auth-field">
                <label htmlFor="auth-confirm-password">确认密码</label>
                <input
                  id="auth-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次输入新密码"
                  minLength={6}
                  required
                />
              </div>
            </>
          )}

          {mode === 'register' && (
            <label className="auth-checkbox">
              <input
                type="checkbox"
                checked={agreePolicy}
                onChange={(e) => setAgreePolicy(e.target.checked)}
              />
              <span className="auth-checkbox-box" aria-hidden="true" />
              <span className="auth-checkbox-text">
                我已阅读并同意
                <a href="#" onClick={(e) => e.preventDefault()}>
                  《用户协议》
                </a>
                与
                <a href="#" onClick={(e) => e.preventDefault()}>
                  《隐私政策》
                </a>
              </span>
            </label>
          )}

          {mode !== 'forgot' && mode !== 'reset' && (
          <div className="auth-sso">
            <div className="auth-sso-divider">
              <span>其他登录方式</span>
            </div>
            <div className="auth-sso-grid">
              <button type="button" className="auth-sso-button" onClick={() => handleSsoClick('wechat')} aria-label="使用微信登录">
                微信
              </button>
              <button type="button" className="auth-sso-button" onClick={() => handleSsoClick('google')} aria-label="使用 Google 登录">
                Google
              </button>
              <button type="button" className="auth-sso-button" onClick={() => handleSsoClick('apple')} aria-label="使用 Apple 登录">
                Apple
              </button>
            </div>
          </div>
          )}

          {error && <div className="auth-error" role="alert">{error}</div>}
          {notice && <div className="auth-notice" role="status">{notice}</div>}

          <button type="submit" className="auth-submit" disabled={!canSubmit}>
            {loading && <span className="auth-submit-spinner" aria-hidden="true" />}
            <span>
              {loading
                ? '处理中...'
                : mode === 'login'
                  ? '登录'
                  : mode === 'register'
                    ? '注册并登录'
                    : mode === 'forgot'
                      ? '发送重置链接'
                      : '重置密码'}
            </span>
          </button>
        </form>

        <div className="auth-foot">
          {mode === 'login' ? (
            <span>
              还没有账号？<button type="button" onClick={() => handleModeChange('register')}>立即注册</button>
            </span>
          ) : mode === 'register' ? (
            <span>
              已有账号？<button type="button" onClick={() => handleModeChange('login')}>直接登录</button>
            </span>
          ) : mode === 'forgot' ? (
            <span>
              想起密码了？<button type="button" onClick={() => handleModeChange('login')}>返回登录</button>
            </span>
          ) : (
            <span>
              没有令牌？<button type="button" onClick={() => handleModeChange('forgot')}>先申请重置链接</button>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
