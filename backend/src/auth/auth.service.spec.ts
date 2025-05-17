import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException } from '@nestjs/common';
import { AuthDto } from './dto';
import * as argon from 'argon2';

describe('AuthService Tests', () => {
  let authService: AuthService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        AT_EXPIRATION_TIME: '60s',
        AT_SECRET: 'at-secret',
        RT_EXPIRATION_TIME: '7d',
        RT_SECRET: 'rt-secret',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it('Should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('Signup', () => {
    const mockAuth: AuthDto = {
      email: 'test@mail.com',
      password: 'pass',
    };

    it('Should throw if user already exists', async () => {
      jest.spyOn(mockPrismaService.user, 'findUnique').mockResolvedValueOnce({ id: 1, email: mockAuth.email, });

      await expect(authService.signup(mockAuth)).rejects.toThrow(ForbiddenException);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalled();
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: {
          email: mockAuth.email,
        },
      });

    });

    it('should create a new user and return tokens', async () => {
      const hashMock = 'hashed_password';
      const createdUser = { id: 1, email: mockAuth.email, hash: hashMock };

      jest.spyOn(mockPrismaService.user, 'findUnique').mockResolvedValueOnce(null);
      jest.spyOn(require('argon2'), 'hash').mockResolvedValueOnce(hashMock);
      jest.spyOn(mockPrismaService.user, 'create').mockResolvedValueOnce(createdUser);

      mockJwtService.signAsync
        .mockResolvedValueOnce('access_token')
        .mockResolvedValueOnce('refresh_token');
      jest.spyOn(authService, 'updateRtHash').mockResolvedValueOnce(undefined as any);

      const tokens = await authService.signup(mockAuth)
      expect(tokens).toEqual({ access_token: 'access_token', refresh_token: 'refresh_token' });

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockAuth.email },
      });
      expect(require('argon2').hash).toHaveBeenCalledWith(mockAuth.password);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: mockAuth.email,
          hash: hashMock,
        },
      });
      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(authService.updateRtHash).toHaveBeenCalledWith(createdUser.id, tokens.refresh_token);
      
    });
  });

  // describe('signin', () => {
  //   it('should throw if user does not exist', async () => {
  //     mockPrismaService.user.findUnique.mockResolvedValueOnce(null);
  //     await expect(service.signin({ email: 'notfound@mail.com', password: 'pass' }))
  //       .rejects.toThrow(ForbiddenException);
  //   });

  //   it('should throw if password does not match', async () => {
  //     mockPrismaService.user.findUnique.mockResolvedValueOnce({ id: 1, email: 'test@mail.com', hash: 'hashed' });
  //     jest.spyOn(require('argon2'), 'verify').mockResolvedValueOnce(false);
  //     await expect(service.signin({ email: 'test@mail.com', password: 'wrong' }))
  //       .rejects.toThrow(ForbiddenException);
  //   });

  //   it('should return tokens if credentials are correct', async () => {
  //     mockPrismaService.user.findUnique.mockResolvedValueOnce({ id: 1, email: 'test@mail.com', hash: 'hashed' });
  //     jest.spyOn(require('argon2'), 'verify').mockResolvedValueOnce(true);
  //     mockJwtService.signAsync.mockResolvedValueOnce('access_token').mockResolvedValueOnce('refresh_token');
  //     jest.spyOn(service, 'updateRtHash').mockResolvedValueOnce(undefined as any);

  //     const tokens = await service.signin({ email: 'test@mail.com', password: 'pass' });
  //     expect(tokens).toEqual({ access_token: 'access_token', refresh_token: 'refresh_token' });
  //   });
  // });

  // describe('logout', () => {
  //   it('should update user hashRt to null', async () => {
  //     mockPrismaService.user.updateMany.mockResolvedValueOnce({ count: 1 });
  //     const result = await service.logout(1);
  //     expect(result).toBe(true);
  //     expect(mockPrismaService.user.updateMany).toHaveBeenCalledWith({
  //       where: { id: 1, hashRt: { not: null } },
  //       data: { hashRt: null },
  //     });
  //   });
  // });

  // describe('refreshToken', () => {
  //   it('should throw if user not found', async () => {
  //     mockPrismaService.user.findUnique.mockResolvedValueOnce(null);
  //     await expect(service.refreshToken(1, 'rt')).rejects.toThrow(ForbiddenException);
  //   });

  //   it('should throw if hashRt is missing', async () => {
  //     mockPrismaService.user.findUnique.mockResolvedValueOnce({ id: 1, hashRt: null });
  //     await expect(service.refreshToken(1, 'rt')).rejects.toThrow(ForbiddenException);
  //   });

  //   it('should throw if refresh token does not match', async () => {
  //     mockPrismaService.user.findUnique.mockResolvedValueOnce({ id: 1, hashRt: 'hashed' });
  //     jest.spyOn(require('argon2'), 'verify').mockResolvedValueOnce(false);
  //     await expect(service.refreshToken(1, 'wrong')).rejects.toThrow(ForbiddenException);
  //   });

  //   it('should return tokens if refresh token matches', async () => {
  //     mockPrismaService.user.findUnique.mockResolvedValueOnce({ id: 1, email: 'test@mail.com', hashRt: 'hashed' });
  //     jest.spyOn(require('argon2'), 'verify').mockResolvedValueOnce(true);
  //     mockJwtService.signAsync.mockResolvedValueOnce('access_token').mockResolvedValueOnce('refresh_token');
  //     jest.spyOn(service, 'updateRtHash').mockResolvedValueOnce(undefined as any);

  //     const tokens = await service.refreshToken(1, 'rt');
  //     expect(tokens).toEqual({ access_token: 'access_token', refresh_token: 'refresh_token' });
  //   });
  // });
});