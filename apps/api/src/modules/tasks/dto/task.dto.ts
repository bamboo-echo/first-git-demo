import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator'

export class CreateTaskDto {
  @IsString()
  title: string

  @IsOptional() @IsString()
  detail?: string

  @IsOptional() @IsString()
  duration?: string

  @IsOptional() @IsIn(['high', 'medium'])
  priority?: 'high' | 'medium'

  @IsOptional() @IsIn(['sprint', 'standard', 'supplement'])
  mode?: 'sprint' | 'standard' | 'supplement'

  @IsOptional() @IsBoolean()
  done?: boolean

  @IsOptional()
  order?: number
}

export class UpdateTaskDto {
  @IsOptional() @IsString() title?: string
  @IsOptional() @IsString() detail?: string
  @IsOptional() @IsString() duration?: string
  @IsOptional() @IsIn(['high', 'medium']) priority?: 'high' | 'medium'
  @IsOptional() @IsIn(['sprint', 'standard', 'supplement']) mode?: 'sprint' | 'standard' | 'supplement'
  @IsOptional() @IsBoolean() done?: boolean
  @IsOptional() order?: number
}
