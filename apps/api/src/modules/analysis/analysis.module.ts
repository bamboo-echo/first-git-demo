import { Module } from '@nestjs/common'
import { AnalysisService } from './analysis.service'
import { AnalysisController } from './analysis.controller'
import { AiModule } from '../ai/ai.module'

@Module({
  imports: [AiModule],
  providers: [AnalysisService],
  controllers: [AnalysisController],
  exports: [AnalysisService],
})
export class AnalysisModule {}
