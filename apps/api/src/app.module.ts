import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from './modules/prisma/prisma.module'
import { AuthModule } from './modules/auth/auth.module'
import { CoursesModule } from './modules/courses/courses.module'
import { MaterialsModule } from './modules/materials/materials.module'
import { TasksModule } from './modules/tasks/tasks.module'
import { AnalysisModule } from './modules/analysis/analysis.module'
import { PlanModule } from './modules/plan/plan.module'
import { AiModule } from './modules/ai/ai.module'
import { HistoryModule } from './modules/history/history.module'
import { HealthController } from './health.controller'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AiModule,
    AuthModule,
    CoursesModule,
    MaterialsModule,
    TasksModule,
    AnalysisModule,
    PlanModule,
    HistoryModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
