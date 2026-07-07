import { Body, Controller, Get, Post, UseGuards, Req } from '@nestjs/common'
import { AuthService } from './auth.service'
import { ForgotPasswordDto, LoginDto, OAuthStartDto, RegisterDto, ResetPasswordDto } from './dto/auth.dto'
import { JwtAuthGuard } from './jwt/jwt-auth.guard'

@Controller('api/auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto)
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto)
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto)
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto)
  }

  @Post('oauth/start')
  startOAuth(@Body() dto: OAuthStartDto) {
    return this.auth.startOAuth(dto.provider)
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: any) {
    return this.auth.me(req.user.id)
  }
}
