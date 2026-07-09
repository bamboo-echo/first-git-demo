import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // CORS：生产环境应限制为前端域名，不允许通配符与凭证同时开启
  const corsOrigin = process.env.CORS_ORIGIN || ''
  const origins = corsOrigin.split(',').map((s) => s.trim()).filter(Boolean)
  if (origins.length === 0) {
    throw new Error('CORS_ORIGIN 必须配置为明确的前端域名列表')
  }
  app.enableCors({
    origin: origins,
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

  console.log(`考点雷达 API 已启动: http://localhost:${port}`)
  console.log(`AI 模式: ${process.env.AI_PROVIDER || 'local'}`)
}

bootstrap().catch((err) => {
  console.error('启动失败:', err)
  process.exit(1)
})
