import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async register(input: { email: string; password: string; name: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: input.email } })
    if (existing) throw new UnauthorizedException('Email already in use')
    const passwordHash = await bcrypt.hash(input.password, 10)
    const user = await this.prisma.user.create({
      data: { email: input.email, name: input.name, passwordHash },
      select: { id: true, email: true, role: true },
    })
    return user
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } })
    if (!user) throw new UnauthorizedException('Invalid credentials')
    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) throw new UnauthorizedException('Invalid credentials')
    return user
  }

  async login(input: { email: string; password: string }) {
    const user = await this.validateUser(input.email, input.password)
    const token = await this.jwt.signAsync({ sub: user.id, email: user.email, role: user.role })
    return { token, user: { id: user.id, email: user.email, role: user.role } }
  }

  // Ensure the freshest role is returned by /auth/me (DB source of truth)
  async getUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true, name: true, businessLicenseNumber: true, tinNumber: true, licenseFilePath: true },
    })
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new UnauthorizedException('User not found')
    const ok = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!ok) throw new UnauthorizedException('Current password is incorrect')
    const passwordHash = await bcrypt.hash(newPassword, 10)
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } })
    return { success: true }
  }

  async updateProfile(userId: string, input: { name?: string; businessLicenseNumber?: string | null; tinNumber?: string | null; licenseFilePath?: string | null }) {
    const data: any = {}
    if (input.name !== undefined) data.name = input.name
    if (input.businessLicenseNumber !== undefined) data.businessLicenseNumber = input.businessLicenseNumber
    if (input.tinNumber !== undefined) data.tinNumber = input.tinNumber
    if (input.licenseFilePath !== undefined) data.licenseFilePath = input.licenseFilePath
    const u = await this.prisma.user.update({ where: { id: userId }, data, select: { id: true, email: true, role: true } })
    return u
  }
}
