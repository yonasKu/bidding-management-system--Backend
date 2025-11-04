import { Controller, Get, Param, Post, UploadedFile, UseGuards, UseInterceptors, Req, Res, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { BidsService } from './bids.service'
import type { Request, Response } from 'express'
import * as path from 'path'
import * as fs from 'fs/promises'
import { createReadStream } from 'fs'
import * as multer from 'multer'

function mb(n: number) { return n * 1024 * 1024 }

@Controller()
export class BidsController {
  constructor(private readonly svc: BidsService) {}

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', {
    storage: multer.memoryStorage(),
    limits: { fileSize: Number(process.env.MAX_UPLOAD_MB || 10) * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (file.mimetype !== 'application/pdf') return cb(new BadRequestException('Only PDF allowed') as any, false)
      cb(null, true)
    },
  }))
  @Post('tenders/:id/bids')
  async submit(@Param('id') tenderId: string, @UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    if (!file) throw new BadRequestException('File is required')
    const dir = process.env.FILE_UPLOAD_DIR || './storage/bids'
    await fs.mkdir(dir, { recursive: true })
    const filename = `${Date.now()}-${Math.random().toString(16).slice(2)}.pdf`
    const fullPath = path.join(dir, filename)
    await fs.writeFile(fullPath, file.buffer)
    const bid = await this.svc.submit(tenderId, (req as any).user.id, fullPath)
    return bid
  }

  @UseGuards(JwtAuthGuard)
  @Get('bids/mine')
  listMine(@Req() req: Request) {
    return this.svc.listMine((req as any).user.id)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('tenders/:id/bids')
  listByTender(@Param('id') id: string) {
    return this.svc.listByTender(id)
  }

  @UseGuards(JwtAuthGuard)
  @Get('bids/:id/download')
  async download(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    const bid = await this.svc.findOne(id)
    if (!bid) throw new NotFoundException('Bid not found')

    // Check permission: admin or bid owner
    const user = (req as any).user
    if (user.role !== 'ADMIN' && bid.vendorId !== user.id) {
      throw new ForbiddenException('Not authorized to download this bid')
    }

    // Check if file exists
    try {
      await fs.access(bid.filePath)
    } catch {
      throw new NotFoundException('Bid file not found')
    }

    // Stream the file
    const file = createReadStream(bid.filePath)
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="bid-${id}.pdf"`,
    })
    file.pipe(res)
  }
}
