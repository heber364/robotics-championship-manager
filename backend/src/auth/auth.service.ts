import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto } from './dto';
import { Tokens } from './types';
import * as argon from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {

  constructor(
    private config: ConfigService,
    private prismaService: PrismaService,
    private jwtService: JwtService
  ) { }

  async signup(dto: AuthDto): Promise<Tokens> {

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

    const tokens = await this.getTokens(newUser.id, newUser.email);

    this.updateRtHash(newUser.id, tokens.refresh_token);

    return tokens;
  }

  async signin(dto: AuthDto): Promise<Tokens> {
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
        }
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

  async updateRtHash(userId: number, rt: string) {
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

  async getTokens(userId: number, email: string): Promise<Tokens> {
    const [atToken, rtToken] = await Promise.all([
      this.jwtService.signAsync({
        sub: userId,
        email,
      }, {
        expiresIn: this.config.get('AT_EXPIRATION_TIME'),
        secret: this.config.get('AT_SECRET'),
      }),
      this.jwtService.signAsync({
        sub: userId,
        email,
      }, {
        expiresIn: this.config.get('RT_EXPIRATION_TIME'),
        secret: this.config.get('RT_SECRET'),
      }),
    ]);

    return {
      access_token: atToken,
      refresh_token: rtToken,
    };
  }

}
