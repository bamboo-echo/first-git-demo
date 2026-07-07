import { IsEmail, IsIn, IsString, MinLength } from 'class-validator'

export class RegisterDto {
  @IsEmail()
  email: string

  @IsString()
  username: string

  @IsString()
  @MinLength(6)
  password: string
}

export class LoginDto {
  @IsEmail()
  email: string

  @IsString()
  password: string
}

export class ForgotPasswordDto {
  @IsEmail()
  email: string
}

export class ResetPasswordDto {
  @IsString()
  token: string

  @IsString()
  @MinLength(6)
  password: string
}

export class OAuthStartDto {
  @IsString()
  @IsIn(['wechat', 'google', 'apple'])
  provider: 'wechat' | 'google' | 'apple'
}
