import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class BidsService {
  constructor(private prisma: PrismaService) {}

  async listMine(userId: string) {
    return this.prisma.bid.findMany({
      where: { vendorId: userId },
      include: { evaluation: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  async listByTender(tenderId: string) {
    return this.prisma.bid.findMany({
      where: { tenderId },
      include: { evaluation: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(id: string) {
    return this.prisma.bid.findUnique({ where: { id } })
  }

  async submit(tenderId: string, userId: string, filePath: string) {
    const existing = await this.prisma.bid.findUnique({ where: { tenderId_vendorId: { tenderId, vendorId: userId } } })
    if (existing) throw new BadRequestException('Bid already submitted for this tender')

    // Ensure tender is open and deadline hasn't passed
    const tender = await this.prisma.tender.findUnique({ where: { id: tenderId } })
    if (!tender) throw new BadRequestException('Tender not found')
    if (tender.status !== 'OPEN') throw new ForbiddenException('Tender not open for bids')
    if (new Date() >= new Date(tender.deadline)) {
      throw new ForbiddenException('Tender deadline has passed')
    }

    return this.prisma.bid.create({ data: { tenderId, vendorId: userId, filePath } })
  }
}
