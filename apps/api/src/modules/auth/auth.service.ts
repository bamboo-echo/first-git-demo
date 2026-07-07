import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Inject } from '@nestjs/common'
import * as bcrypt from 'bcryptjs'
import { createHash, randomBytes } from 'crypto'
import { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto } from './dto/auth.dto'

@Injectable()
export class AuthService {
  constructor(
    @Inject('PRISMA') private prisma: any,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (existing) {
      throw new ConflictException('该邮箱已注册')
    }

    const hashed = await bcrypt.hash(dto.password, 10)
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        password: hashed,
      },
    })

    const token = this.signToken(user.id, user.email, user.role)
    return {
      token,
      user: { id: user.id, email: user.email, username: user.username, role: user.role, createdAt: user.createdAt },
    }
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (!user) throw new UnauthorizedException('邮箱或密码错误')

    const valid = await bcrypt.compare(dto.password, user.password)
    if (!valid) throw new UnauthorizedException('邮箱或密码错误')

    const token = this.signToken(user.id, user.email, user.role)
    return {
      token,
      user: { id: user.id, email: user.email, username: user.username, role: user.role, createdAt: user.createdAt },
    }
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new UnauthorizedException()
    return { id: user.id, email: user.email, username: user.username, role: user.role, createdAt: user.createdAt }
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } })
    const message = '如果邮箱已注册，重置链接已生成'
    if (!user) return { success: true, message }

    const rawToken = randomBytes(32).toString('hex')
    const tokenHash = this.hashResetToken(rawToken)
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30)

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: tokenHash,
        passwordResetExpiresAt: expiresAt,
      },
    })

    const resetUrl = this.buildResetUrl(rawToken)
    return {
      success: true,
      message,
      resetUrl,
      expiresAt,
    }
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = this.hashResetToken(dto.token)
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: tokenHash,
        passwordResetExpiresAt: { gt: new Date() },
      },
    })

    if (!user) throw new BadRequestException('重置链接无效或已过期')

    const hashed = await bcrypt.hash(dto.password, 10)
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
    })

    return { success: true, message: '密码已更新，请使用新密码登录' }
  }

  startOAuth(provider: 'wechat' | 'google' | 'apple') {
    const config = this.getOAuthConfig(provider)
    if (!config.clientId || !config.redirectUri || !config.authorizeUrl) {
      return {
        configured: false,
        provider,
        message: `${config.label} 登录尚未配置，请先设置 ${config.envPrefix}_CLIENT_ID 与 ${config.envPrefix}_REDIRECT_URI`,
      }
    }

    const state = randomBytes(16).toString('hex')
    const url = new URL(config.authorizeUrl)
    url.searchParams.set('client_id', config.clientId)
    url.searchParams.set('redirect_uri', config.redirectUri)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('scope', config.scope)
    url.searchParams.set('state', state)

    return {
      configured: true,
      provider,
      url: url.toString(),
      state,
    }
  }

  private signToken(id: string, email: string, role: string) {
    return this.jwt.sign({ sub: id, email, role })
  }

  private hashResetToken(token: string) {
    return createHash('sha256').update(token).digest('hex')
  }

  private buildResetUrl(token: string) {
    const origin = process.env.APP_ORIGIN || process.env.CORS_ORIGIN || 'http://localhost:5173'
    return `${origin.replace(/\/$/, '')}/?resetToken=${encodeURIComponent(token)}`
  }

  private getOAuthConfig(provider: 'wechat' | 'google' | 'apple') {
    const configs = {
      wechat: {
        label: '微信',
        envPrefix: 'WECHAT_OAUTH',
        clientId: process.env.WECHAT_OAUTH_CLIENT_ID,
        redirectUri: process.env.WECHAT_OAUTH_REDIRECT_URI,
        authorizeUrl: process.env.WECHAT_OAUTH_AUTHORIZE_URL || 'https://open.weixin.qq.com/connect/qrconnect',
        scope: process.env.WECHAT_OAUTH_SCOPE || 'snsapi_login',
      },
      google: {
        label: 'Google',
        envPrefix: 'GOOGLE_OAUTH',
        clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
        redirectUri: process.env.GOOGLE_OAUTH_REDIRECT_URI,
        authorizeUrl: process.env.GOOGLE_OAUTH_AUTHORIZE_URL || 'https://accounts.google.com/o/oauth2/v2/auth',
        scope: process.env.GOOGLE_OAUTH_SCOPE || 'openid email profile',
      },
      apple: {
        label: 'Apple',
        envPrefix: 'APPLE_OAUTH',
        clientId: process.env.APPLE_OAUTH_CLIENT_ID,
        redirectUri: process.env.APPLE_OAUTH_REDIRECT_URI,
        authorizeUrl: process.env.APPLE_OAUTH_AUTHORIZE_URL || 'https://appleid.apple.com/auth/authorize',
        scope: process.env.APPLE_OAUTH_SCOPE || 'name email',
      },
    }
    return configs[provider]
  }
}
