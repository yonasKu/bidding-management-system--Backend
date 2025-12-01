import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import { EvaluationsService } from './evaluations.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'

@Controller('evaluations')
export class EvaluationsController {
  constructor(private readonly svc: EvaluationsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  list() {
    return this.svc.list()
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  create(@Body() body: { bidId: string; technicalScore: number; financialScore: number; remarks?: string }) {
    return this.svc.create(body)
  }
}
