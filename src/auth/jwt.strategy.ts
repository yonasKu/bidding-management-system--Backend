import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { Request } from 'express'
import { PrismaService } from '../prisma/prisma.service'

function cookieExtractor(req: Request) {
  if (req && req.cookies) {
    return req.cookies['token']
  }
  return null
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dev-secret',
    })
  }

  async validate(payload: any) {
    // Fetch latest user role from DB to avoid stale JWT role
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true },
    })
    return {
      id: payload.sub,
      email: payload.email,
      role: user?.role ?? payload.role,
    }
  }
}
