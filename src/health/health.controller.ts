import { Controller, Get } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getHealth() {
    let db = 'disconnected'
    try {
      await this.prisma.$queryRaw`SELECT 1`
      db = 'connected'
    } catch (e) {
      db = 'disconnected'
    }
    return {
      status: db === 'connected' ? 'ok' : 'degraded',
      database: db,
      timestamp: new Date().toISOString(),
    }
  }
}
