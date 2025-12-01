import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class TendersService {
  constructor(private prisma: PrismaService) {}

  private validateDeadline(deadline: Date) {
    const now = new Date()
    const minDeadline = new Date(now)
    // Ethiopian Procurement Law: 30 days minimum for goods/services
    minDeadline.setDate(minDeadline.getDate() + 30)
    
    if (deadline < minDeadline) {
      throw new BadRequestException(
        'Deadline must be at least 30 days from now (Ethiopian Procurement Directive No. 430/2018)'
      )
    }
  }

  async closeExpiredTenders() {
    const now = new Date()
    await this.prisma.tender.updateMany({
      where: {
        status: 'OPEN',
        deadline: { lt: now },
      },
      data: { status: 'CLOSED' },
    })
  }

  async list(filters?: { search?: string; openOnly?: boolean }) {
    // Auto-close expired tenders
    await this.closeExpiredTenders()
    const where: any = {}
    if (filters?.openOnly) where.status = 'OPEN'
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ]
    }
    return this.prisma.tender.findMany({ where, orderBy: { createdAt: 'desc' } })
  }

  async detail(id: string) {
    const t = await this.prisma.tender.findUnique({ where: { id } })
    if (!t) throw new NotFoundException('Tender not found')
    return t
  }

  create(input: { title: string; description?: string; deadline: string }) {
    const deadline = new Date(input.deadline)
    this.validateDeadline(deadline)
    return this.prisma.tender.create({
      data: {
        title: input.title,
        description: input.description,
        deadline,
      },
    })
  }

  async update(id: string, input: { title?: string; description?: string; deadline?: string }) {
    const tender = await this.detail(id)
    
    // Only allow updates if tender is still open
    if (tender.status !== 'OPEN') {
      throw new BadRequestException('Cannot update closed or cancelled tender')
    }
    
    // Check if deadline hasn't passed
    if (new Date() >= new Date(tender.deadline)) {
      throw new BadRequestException('Cannot update tender after deadline')
    }
    
    const data: any = {}
    if (input.title) data.title = input.title
    if (input.description !== undefined) data.description = input.description
    if (input.deadline) {
      const newDeadline = new Date(input.deadline)
      this.validateDeadline(newDeadline)
      data.deadline = newDeadline
    }
    
    return this.prisma.tender.update({ where: { id }, data })
  }

  async cancel(id: string) {
    const t = await this.detail(id)
    if (t.status !== 'OPEN') throw new BadRequestException('Cannot cancel non-open tender')
    
    // Check if deadline has passed
    if (new Date() >= new Date(t.deadline)) {
      throw new BadRequestException('Cannot cancel tender after deadline')
    }
    
    return this.prisma.tender.update({ where: { id }, data: { status: 'CANCELLED' } })
  }

  async close(id: string) {
    const t = await this.detail(id)
    if (t.status !== 'OPEN') throw new BadRequestException('Cannot close non-open tender')
    return this.prisma.tender.update({ where: { id }, data: { status: 'CLOSED' } })
  }

  async award(id: string, bidId: string) {
    const t = await this.detail(id)
    if (t.status === 'CANCELLED') throw new BadRequestException('Cannot award a cancelled tender')
    if ((t as any).winningBidId) throw new BadRequestException('Tender already awarded')
    // Require tender closed or deadline passed
    if (t.status !== 'CLOSED' && new Date() < new Date(t.deadline)) {
      throw new BadRequestException('Tender must be closed (or past deadline) before award')
    }

    const bid = await this.prisma.bid.findUnique({ where: { id: bidId }, include: { evaluation: true } })
    if (!bid || bid.tenderId !== id) throw new NotFoundException('Bid not found for this tender')

    // Optional: ensure evaluated before award
    if (!bid.evaluation) {
      throw new BadRequestException('Bid must be evaluated before award')
    }

    await this.prisma.$transaction([
      this.prisma.tender.update({ where: { id }, data: { winningBidId: bidId, awardedAt: new Date() } as any }),
      this.prisma.bid.update({ where: { id: bidId }, data: { status: 'AWARDED' } as any }),
    ])

    return { tenderId: id, winningBidId: bidId }
  }

  async results(id: string) {
    // Public: list evaluated bids (score, remarks) and winner flag
    const t = await this.detail(id)
    const bids = await this.prisma.bid.findMany({
      where: { tenderId: id },
      include: { evaluation: true },
      orderBy: { createdAt: 'desc' },
    })
    return bids
      .filter((b) => !!b.evaluation)
      .map((b) => ({
        bidId: b.id,
        score: b.evaluation!.score,
        remarks: b.evaluation!.remarks ?? undefined,
        isWinner: (t as any).winningBidId ? b.id === (t as any).winningBidId : false,
      }))
  }
}
