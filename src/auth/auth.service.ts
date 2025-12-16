import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Si aún no tienes hash de bcrypt, de momento compara en plano:
    if (user.password !== password) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return user;
  }

  async login(user: { id: string; email: string }) {
    const payload = { sub: user.id, email: user.email };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }

  async register(data: { email: string; password: string }) {
    const exists = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (exists) {
      throw new UnauthorizedException('El email ya está registrado');
    }

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: data.password, // luego podemos cambiar a bcrypt
      },
    });

    return this.login(user);
  }
}
