import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class EvaluationsService {
  constructor(private prisma: PrismaService) {}

  list() {
    return this.prisma.evaluation.findMany({ orderBy: { createdAt: 'desc' } })
  }

  async create(input: { bidId: string; score: number; remarks?: string }) {
    const bid = await this.prisma.bid.findUnique({ where: { id: input.bidId } })
    if (!bid) throw new NotFoundException('Bid not found')
    const ev = await this.prisma.evaluation.upsert({
      where: { bidId: input.bidId },
      update: { score: input.score, remarks: input.remarks },
      create: { bidId: input.bidId, score: input.score, remarks: input.remarks },
    })
    await this.prisma.bid.update({ where: { id: input.bidId }, data: { status: 'EVALUATED' } })
    return ev
  }
}
