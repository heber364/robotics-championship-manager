import { ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto } from './dto';
import { Tokens } from './types';
import * as argon from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private config: ConfigService,
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async signup(dto: AuthDto): Promise<{ userId: number }> {
    const existingUser = await this.prismaService.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (existingUser) {
      throw new ForbiddenException('User already exists');
    }
    const hash = await argon.hash(dto.password);

    const newUser = await this.prismaService.user.create({
      data: {
        email: dto.email,
        hash,
      },
    });

    const otpCode = await this.generateOtpCode(newUser.id);

    await this.sendOtpEmail(otpCode, newUser.email);

    return { userId: newUser.id };
  }

  async signin(dto: AuthDto): Promise<{ userId: number }> {
    const user = await this.prismaService.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      throw new ForbiddenException('Credentials incorrect');
    }

    const passwordMatches = await argon.verify(user.hash, dto.password);

    if (!passwordMatches) {
      throw new ForbiddenException('Access Deinied');
    }

    const otpCode = await this.generateOtpCode(user.id);

    await this.sendOtpEmail(otpCode, user.email);

    return { userId: user.id };
  }

  async verifyOtp(dto: { userId: number; otpCode: string }): Promise<Tokens> {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: dto.userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.hashOtpCode === null || user.otpExpiresAt === null) {
      throw new UnauthorizedException('Try to login first');
    }

    const isOtpValid = await argon.verify(user.hashOtpCode, dto.otpCode);

    if (!isOtpValid) {
      throw new UnauthorizedException('Invalid OTP code');
    }

    const isOtpExpired = user.otpExpiresAt && new Date() > user.otpExpiresAt;

    if (isOtpExpired) {
      await this.clearOtpData(user.id);
      throw new UnauthorizedException('OTP code expired');
    }

    await this.clearOtpData(user.id);

    const tokens = await this.getTokens(user.id, user.email);
    await this.updateRtHash(user.id, tokens.refresh_token);
    return tokens;
  }

  async logout(userId: number) {
    await this.prismaService.user.updateMany({
      where: {
        id: userId,
        hashRt: {
          not: null,
        },
      },
      data: {
        hashRt: null,
      },
    });
    return true;
  }

  async refreshToken(userId: number, rt: string): Promise<Tokens> {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user || !user.hashRt) {
      throw new ForbiddenException('Access denied');
    }

    const rtMatches = await argon.verify(user.hashRt, rt);

    if (!rtMatches) {
      throw new ForbiddenException('Access denied');
    }

    const tokens = await this.getTokens(user.id, user.email);
    await this.updateRtHash(user.id, tokens.refresh_token);
    return tokens;
  }

  private async generateOtpCode(userId: number): Promise<string> {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashOtpCode = await argon.hash(otpCode);
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration

    await this.prismaService.user.update({
      where: {
        id: userId,
      },
      data: {
        hashOtpCode,
        otpExpiresAt,
      },
    });

    return otpCode;
  }

  private async sendOtpEmail(otpCode: string, userEmail: string): Promise<void> {
    await this.emailService.sendEmail({
      recipients: userEmail,
      subject: 'Seu código de verificação',
      text: `Seu código de verificação é: ${otpCode}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 400px;">
          <h2>Verificação de Login</h2>
          <p>Use o código abaixo para acessar sua conta:</p>
          <div style="font-size: 2rem; font-weight: bold; letter-spacing: 4px; margin: 16px 0;">
            ${otpCode}
          </div>
          <p>O código expira em 5 minutos.</p>
          <p>Se você não solicitou este código, ignore este email.</p>
        </div>
      `,
    });
  }

  private async clearOtpData(userId: number): Promise<void> {
    await this.prismaService.user.updateMany({
      where: {
        id: userId,
        AND: [{ hashOtpCode: { not: null } }, { otpExpiresAt: { not: null } }],
      },
      data: {
        hashOtpCode: null,
        otpExpiresAt: null,
      },
    });
  }

  private async updateRtHash(userId: number, rt: string) {
    const hash = await argon.hash(rt);

    await this.prismaService.user.update({
      where: {
        id: userId,
      },
      data: {
        hashRt: hash,
      },
    });
  }

  private async getTokens(userId: number, email: string): Promise<Tokens> {
    const [atToken, rtToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
        },
        {
          expiresIn: this.config.get('AT_EXPIRATION_TIME'),
          secret: this.config.get('AT_SECRET'),
        },
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
        },
        {
          expiresIn: this.config.get('RT_EXPIRATION_TIME'),
          secret: this.config.get('RT_SECRET'),
        },
      ),
    ]);

    return {
      access_token: atToken,
      refresh_token: rtToken,
    };
  }
}
