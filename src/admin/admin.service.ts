import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [activeTenders, closedTenders, cancelledTenders, totalBids, pendingEvaluations, completedEvaluations] = await Promise.all([
      this.prisma.tender.count({ where: { status: 'OPEN' } }),
      this.prisma.tender.count({ where: { status: 'CLOSED' } }),
      this.prisma.tender.count({ where: { status: 'CANCELLED' } }),
      this.prisma.bid.count(),
      this.prisma.bid.count({ where: { evaluation: null } }),
      this.prisma.evaluation.count(),
    ])

    return {
      activeTenders,
      closedTenders,
      cancelledTenders,
      totalBids,
      pendingEvaluations,
      completedEvaluations,
    }
  }
}
