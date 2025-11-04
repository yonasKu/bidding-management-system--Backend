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
}
