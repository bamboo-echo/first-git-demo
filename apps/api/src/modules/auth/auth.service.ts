import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Inject } from '@nestjs/common'
import * as bcrypt from 'bcryptjs'
import { RegisterDto, LoginDto } from './dto/auth.dto'

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

  private signToken(id: string, email: string, role: string) {
    return this.jwt.sign({ sub: id, email, role })
  }
}
