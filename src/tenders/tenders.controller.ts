import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { TendersService } from './tenders.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'

@Controller('tenders')
export class TendersController {
  constructor(private readonly svc: TendersService) {}

  @Get()
  list(@Query('search') search?: string, @Query('openOnly') openOnly?: string) {
    const filters = {
      search: search || undefined,
      openOnly: openOnly === 'true',
    }
    return this.svc.list(filters)
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.svc.detail(id)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  create(@Body() body: { title: string; description?: string; deadline: string }) {
    return this.svc.create(body)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: { title?: string; description?: string; deadline?: string }) {
    return this.svc.update(id, body)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.svc.cancel(id)
  }
}
