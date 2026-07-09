import { ExtractJwt, Strategy } from 'passport-jwt'
import { PassportStrategy } from '@nestjs/passport'
import { Injectable, UnauthorizedException, Inject } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @Inject('PRISMA') private prisma: any,
  ) {
    const secret = config.get<string>('JWT_SECRET')
    if (!secret || secret.length < 32) {
      throw new Error('JWT_SECRET 必须配置且长度不小于 32 位')
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    })
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user) throw new UnauthorizedException('用户不存在')
    return { id: user.id, email: user.email, role: user.role }
  }
}
