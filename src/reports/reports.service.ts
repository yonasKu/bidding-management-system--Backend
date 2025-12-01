import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

function parseRange(range?: string): Date | undefined {
  if (!range) return undefined
  const m = /^([0-9]+)([dwm])$/i.exec(range)
  if (!m) return undefined
  const n = parseInt(m[1], 10)
  const unit = m[2].toLowerCase()
  const now = new Date()
  const from = new Date(now)
  if (unit === 'd') from.setDate(now.getDate() - n)
  if (unit === 'w') from.setDate(now.getDate() - n * 7)
  if (unit === 'm') from.setMonth(now.getMonth() - n)
  return from
}

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async summary(range?: string) {
    const from = parseRange(range)
    const whereCreated: any = from ? { createdAt: { gte: from } } : {}

    const [open, closed, cancelled, bids, evals] = await Promise.all([
      this.prisma.tender.count({ where: { status: 'OPEN', ...(from ? whereCreated : {}) } as any }),
      this.prisma.tender.count({ where: { status: 'CLOSED', ...(from ? whereCreated : {}) } as any }),
      this.prisma.tender.count({ where: { status: 'CANCELLED', ...(from ? whereCreated : {}) } as any }),
      this.prisma.bid.count({ where: from ? whereCreated : {} }),
      this.prisma.evaluation.count({ where: from ? whereCreated : {} }),
    ])

    return { open, closed, cancelled, bids, evaluations: evals, from: from?.toISOString() }
  }

  private toCSV(headers: string[], rows: (string | number | null | undefined)[][]) {
    const esc = (v: any) => {
      if (v === null || v === undefined) return ''
      const s = String(v)
      if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
      return s
    }
    return [headers.join(','), ...rows.map(r => r.map(esc).join(','))].join('\n')
  }

  async tendersCSV(range?: string) {
    const from = parseRange(range)
    const where: any = from ? { createdAt: { gte: from } } : {}
    const tenders = await this.prisma.tender.findMany({ where, orderBy: { createdAt: 'desc' } })
    const headers = ['id','title','status','deadline','createdAt','winningBidId','awardedAt']
    const rows = tenders.map(t => [t.id, t.title, t.status, t.deadline?.toISOString(), t.createdAt?.toISOString(), (t as any).winningBidId ?? '', (t as any).awardedAt ? (t as any).awardedAt.toISOString?.() : ''])
    return this.toCSV(headers, rows)
  }

  async bidsCSV(range?: string) {
    const from = parseRange(range)
    const where: any = from ? { createdAt: { gte: from } } : {}
    const bids = await this.prisma.bid.findMany({ where, include: { evaluation: true }, orderBy: { createdAt: 'desc' } })
    const headers = ['id','tenderId','vendorId','status','createdAt','evaluated','score']
    const rows = bids.map(b => [b.id, b.tenderId, b.vendorId, b.status, b.createdAt?.toISOString(), b.evaluation ? 'yes' : 'no', b.evaluation?.score ?? ''])
    return this.toCSV(headers, rows)
  }

  async evaluationsCSV(range?: string) {
    const from = parseRange(range)
    const where: any = from ? { createdAt: { gte: from } } : {}
    const evs = await this.prisma.evaluation.findMany({ where, orderBy: { createdAt: 'desc' } })
    const headers = ['id','bidId','score','technicalScore','financialScore','createdAt']
    const rows = evs.map(e => [e.id, e.bidId, e.score, (e as any).technicalScore ?? '', (e as any).financialScore ?? '', e.createdAt?.toISOString()])
    return this.toCSV(headers, rows)
  }
}
