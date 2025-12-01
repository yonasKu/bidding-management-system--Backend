import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class EvaluationsService {
  constructor(private prisma: PrismaService) {}

  list() {
    return this.prisma.evaluation.findMany({ orderBy: { createdAt: 'desc' } })
  }

  async create(input: { bidId: string; technicalScore: number; financialScore: number; remarks?: string }) {
    const bid = await this.prisma.bid.findUnique({ where: { id: input.bidId } })
    if (!bid) throw new NotFoundException('Bid not found')
    const tech = Number(input.technicalScore ?? 0)
    const fin = Number(input.financialScore ?? 0)
    if (tech < 0 || tech > 70) throw new Error('technicalScore must be between 0 and 70')
    if (fin < 0 || fin > 30) throw new Error('financialScore must be between 0 and 30')
    const total = Math.round(tech + fin)
    const ev = await this.prisma.evaluation.upsert({
      where: { bidId: input.bidId },
      update: { score: total, remarks: input.remarks, technicalScore: tech as any, financialScore: fin as any },
      create: { bidId: input.bidId, score: total, remarks: input.remarks, technicalScore: tech as any, financialScore: fin as any },
    })
    await this.prisma.bid.update({ where: { id: input.bidId }, data: { status: 'EVALUATED' } })
    return ev
  }
}
