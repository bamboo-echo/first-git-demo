import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true })

  // CORS：允许所有开发来源（生产环境应限制为前端域名）
  const corsOrigin = process.env.CORS_ORIGIN || '*'
  const origins = corsOrigin.split(',').map((s) => s.trim())
  app.enableCors({
    origin: origins.includes('*') ? true : origins,
    credentials: true,
  })

  // 全局数据验证
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: false,
  }))

  // 优雅关闭
  app.enableShutdownHooks()

  const port = parseInt(process.env.PORT || '4000', 10)
  await app.listen(port, '0.0.0.0')

  console.log(`🚀 考点雷达 API 已启动: http://localhost:${port}`)
  console.log(`📊 AI 模式: ${process.env.AI_PROVIDER || 'local'}`)
  console.log(`💾 数据库: ${process.env.DATABASE_URL || 'file:./storage/dev.db'}`)
}

bootstrap().catch((err) => {
  console.error('启动失败:', err)
  process.exit(1)
})
