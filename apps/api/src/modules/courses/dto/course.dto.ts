import { IsOptional, IsString } from 'class-validator'

export class CreateCourseDto {
  @IsString()
  name: string

  @IsOptional() @IsString()
  examTime?: string

  @IsOptional() @IsString()
  reviewHours?: string

  @IsOptional() @IsString()
  goalMode?: string

  @IsOptional() @IsString()
  examScope?: string

  @IsOptional() @IsString()
  notes?: string
}

export class UpdateCourseDto {
  @IsOptional() @IsString()
  name?: string

  @IsOptional() @IsString()
  examTime?: string

  @IsOptional() @IsString()
  reviewHours?: string

  @IsOptional() @IsString()
  goalMode?: string

  @IsOptional() @IsString()
  examScope?: string

  @IsOptional() @IsString()
  notes?: string
}
