import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  SignInDto,
  SignUpDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
  RequestEmailVerificationDto,
} from './dto';
import { Tokens } from './types';
import * as argon from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import * as crypto from 'crypto';
import { Role } from '../common/enums';

@Injectable()
export class AuthService {
  constructor(
    private config: ConfigService,
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async signup(signUpDto: SignUpDto): Promise<{ userId: number }> {
    const existingUser = await this.prismaService.user.findUnique({
      where: {
        email: signUpDto.email,
      },
    });

    if (existingUser) {
      throw new ForbiddenException('User already exists');
    }
    const hash = await argon.hash(signUpDto.password);

    const newUser = await this.prismaService.user.create({
      data: {
        name: signUpDto.name,
        email: signUpDto.email,
        hash,
      },
    });

    const token = await this.generateVerificationToken(newUser.id);
    await this.sendVerificationEmail(token, newUser.email);

    return { userId: newUser.id };
  }

  async signin(SignInDto: SignInDto): Promise<Tokens> {
    const user = await this.prismaService.user.findUnique({
      where: {
        email: SignInDto.email,
      },
    });

    if (!user) {
      throw new ForbiddenException('Credentials incorrect');
    }

    const passwordMatches = await argon.verify(user.hash, SignInDto.password);

    if (!passwordMatches) {
      throw new ForbiddenException('Access Denied');
    }

    if (!user.emailVerified) {
      throw new ForbiddenException('Please verify your email before logging in');
    }

    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.updateRtHash(user.id, tokens.refresh_token);
    return tokens;
  }

  async requestEmailVerification(
    requestEmailVerificationDto: RequestEmailVerificationDto,
  ): Promise<void> {
    const user = await this.prismaService.user.findUnique({
      where: {
        email: requestEmailVerificationDto.email,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      throw new ForbiddenException('Email already verified');
    }

    const token = await this.generateVerificationToken(user.id);
    await this.sendVerificationEmail(token, user.email);
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<Tokens> {
    const user = await this.prismaService.user.findFirst({
      where: {
        emailVerificationToken: verifyEmailDto.token,
        emailVerificationTokenExpiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid or expired verification token');
    }

    await this.prismaService.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationTokenExpiresAt: null,
      },
    });

    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.updateRtHash(user.id, tokens.refresh_token);
    return tokens;
  }

  async logout(userId: number): Promise<boolean> {
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

  async refreshToken(userId: number, refreshToken: string): Promise<Tokens> {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user || !user.hashRt) {
      throw new ForbiddenException('Access Denied');
    }

    const refreshTokenMatches = await argon.verify(user.hashRt, refreshToken);

    if (!refreshTokenMatches) {
      throw new ForbiddenException('Access Denied');
    }

    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.updateRtHash(user.id, tokens.refresh_token);
    return tokens;
  }

  async changePassword(userId: number, changePasswordDto: ChangePasswordDto): Promise<void> {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordMatches = await argon.verify(user.hash, changePasswordDto.oldPassword);

    if (!passwordMatches) {
      throw new ForbiddenException('Access Denied');
    }

    const newHash = await argon.hash(changePasswordDto.newPassword);

    await this.prismaService.user.update({
      where: {
        id: userId,
      },
      data: {
        hash: newHash,
      },
    });
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const user = await this.prismaService.user.findUnique({
      where: {
        email: forgotPasswordDto.email,
      },
    });

    if (!user) {
      throw new ForbiddenException('Credentials incorrect');
    }

    const token = await this.generateVerificationToken(user.id);
    await this.sendVerificationEmail(token, user.email);
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const user = await this.prismaService.user.findFirst({
      where: {
        emailVerificationToken: resetPasswordDto.token,
        emailVerificationTokenExpiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid or expired verification token');
    }

    const newHash = await argon.hash(resetPasswordDto.newPassword);

    await this.prismaService.user.update({
      where: {
        id: user.id,
      },
      data: {
        hash: newHash,
        emailVerificationToken: null,
        emailVerificationTokenExpiresAt: null,
      },
    });
  }

  private async generateVerificationToken(userId: number): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.prismaService.user.update({
      where: { id: userId },
      data: {
        emailVerificationToken: token,
        emailVerificationTokenExpiresAt: expiresAt,
      },
    });

    return token;
  }

  private async sendVerificationEmail(token: string, userEmail: string): Promise<void> {
    const verificationLink = `${this.config.get('FRONTEND_URL')}/verify-email?token=${token}`;

    await this.emailService.sendEmail({
      recipients: userEmail,
      subject: 'Verifique seu email',
      text: `Clique no link para verificar seu email: ${verificationLink}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 400px;">
          <h2>Verificação de Email</h2>
          <p>Clique no link abaixo para verificar seu email:</p>
          <p><a href="${verificationLink}">${verificationLink}</a></p>
          <p>O link expira em 24 horas.</p>
          <p>Se você não solicitou esta verificação, ignore este email.</p>
        </div>
      `,
    });
  }

  private async getTokens(userId: number, email: string, role: Role): Promise<Tokens> {
    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
          role,
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
          role,
        },
        {
          expiresIn: this.config.get('RT_EXPIRATION_TIME'),
          secret: this.config.get('RT_SECRET'),
        },
      ),
    ]);

    return {
      access_token: at,
      refresh_token: rt,
    };
  }

  private async updateRtHash(userId: number, refreshToken: string): Promise<void> {
    const hash = await argon.hash(refreshToken);
    await this.prismaService.user.update({
      where: {
        id: userId,
      },
      data: {
        hashRt: hash,
      },
    });
  }
}
