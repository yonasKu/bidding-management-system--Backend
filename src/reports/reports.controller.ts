import { Controller, Get, Header, Query, Res, UseGuards } from '@nestjs/common'
import type { Response } from 'express'
import { ReportsService } from './reports.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('reports')
export class ReportsController {
  constructor(private readonly svc: ReportsService) {}

  @Get('summary')
  async summary(@Query('range') range?: string) {
    return this.svc.summary(range)
  }

  @Get('tenders.csv')
  async tendersCsv(@Res() res: Response, @Query('range') range?: string) {
    const csv = await this.svc.tendersCSV(range)
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="tenders.csv"')
    res.send(csv)
  }

  @Get('bids.csv')
  async bidsCsv(@Res() res: Response, @Query('range') range?: string) {
    const csv = await this.svc.bidsCSV(range)
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="bids.csv"')
    res.send(csv)
  }

  @Get('evaluations.csv')
  async evaluationsCsv(@Res() res: Response, @Query('range') range?: string) {
    const csv = await this.svc.evaluationsCSV(range)
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="evaluations.csv"')
    res.send(csv)
  }
}
