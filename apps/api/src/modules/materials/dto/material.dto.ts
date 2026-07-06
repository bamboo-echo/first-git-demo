import { IsIn, IsOptional, IsString } from 'class-validator'

export class CreateMaterialDto {
  @IsString()
  title: string

  @IsOptional() @IsString()
  description?: string

  @IsOptional() @IsString()
  format?: string

  @IsIn(['exam', 'ppt', 'catalog', 'scope', 'notes', 'exercises'])
  category: 'exam' | 'ppt' | 'catalog' | 'scope' | 'notes' | 'exercises'

  @IsOptional() @IsIn(['ready', 'draft'])
  status?: 'ready' | 'draft'

  @IsOptional() @IsString()
  fileName?: string

  @IsOptional() @IsString()
  fileUrl?: string
}
