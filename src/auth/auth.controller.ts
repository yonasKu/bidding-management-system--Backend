import { Body, Controller, Get, Post, Res, UseGuards, Req } from '@nestjs/common'
import type { Response, Request } from 'express'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from './jwt-auth.guard'
import { Patch, UploadedFile, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as multer from 'multer'

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  async register(@Body() body: { email: string; password: string; name: string }) {
    return this.auth.register(body)
  }

  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const { token, user } = await this.auth.login(body)
    const secure = (process.env.COOKIE_SECURE || 'false') === 'true'
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      maxAge: 24 * 60 * 60 * 1000,
    })
    return user
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: Request) {
    const payloadUser = (req as any).user as { id: string }
    // Fetch fresh user from DB to ensure latest role
    return this.auth.getUserById(payloadUser.id)
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('token')
    return { success: true }
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(
    @Req() req: Request,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    const user = (req as any).user as { id: string }
    return this.auth.changePassword(user.id, body.currentPassword, body.newPassword)
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(
    @Req() req: Request,
    @Body() body: { name?: string; businessLicenseNumber?: string | null; tinNumber?: string | null; licenseFilePath?: string | null },
  ) {
    const user = (req as any).user as { id: string }
    return this.auth.updateProfile(user.id, body)
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', { storage: multer.memoryStorage() }))
  @Post('profile/license')
  async uploadLicense(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) return { success: false, message: 'File is required' }
    const dir = process.env.FILE_UPLOAD_DIR || './uploads'
    const licenseDir = path.join(dir, 'licenses')
    await fs.mkdir(licenseDir, { recursive: true })
    const filename = `${Date.now()}-${Math.random().toString(16).slice(2)}-${file.originalname.replace(/\s+/g, '_')}`
    const fullPath = path.join(licenseDir, filename)
    await fs.writeFile(fullPath, file.buffer)
    return { success: true, path: fullPath }
  }
}
