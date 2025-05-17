import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException } from '@nestjs/common';

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
    const mockAuth = {
      email: 'test@mail.com',
      password: 'pass',
    };

    it('should throw if user already exists', async () => {
      jest.spyOn(mockPrismaService.user, 'findUnique').mockResolvedValueOnce({ id: 1, email: mockAuth.email, });

      await expect(authService.signup(mockAuth)).rejects.toThrow(new ForbiddenException('User already exists'));

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

  describe('Signin', () => {
    const mockSignAuth = {
      email: 'test@mail.com',
      password: 'pass',
    };
    it('should throw if user does not exist', async () => {
      jest.spyOn(mockPrismaService.user, 'findUnique').mockResolvedValueOnce(null);

      await expect(authService.signin(mockSignAuth))
        .rejects.toThrow(new ForbiddenException('Credentials incorrect'));

      expect(mockPrismaService.user.findUnique).toHaveBeenCalled();
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: {
          email: mockSignAuth.email,
        },
      })

    });

    const hashMock = 'hashed_password';
    it('should throw if password does not match', async () => {
      jest.spyOn(mockPrismaService.user, 'findUnique').mockResolvedValueOnce({ id: 1, email: mockSignAuth.email, hash: hashMock });
      jest.spyOn(require('argon2'), 'verify').mockResolvedValueOnce(false);
      await expect(authService.signin(mockSignAuth))
        .rejects.toThrow(new ForbiddenException('Access Deinied'));

      expect(mockPrismaService.user.findUnique).toHaveBeenCalled();
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: {
          email: mockSignAuth.email,
        },
      })
      expect(require('argon2').verify).toHaveBeenCalledWith(hashMock, mockSignAuth.password);

    });

    it('should return tokens if credentials are correct', async () => {
      jest.spyOn(mockPrismaService.user, 'findUnique').mockResolvedValueOnce({ id: 1, email: mockSignAuth.email, hash: hashMock });
      jest.spyOn(require('argon2'), 'verify').mockResolvedValueOnce(true);
      mockJwtService.signAsync
        .mockResolvedValueOnce('access_token')
        .mockResolvedValueOnce('refresh_token');

      jest.spyOn(authService, 'updateRtHash').mockResolvedValueOnce(undefined as any);

      const tokens = await authService.signin(mockSignAuth);
      expect(tokens).toEqual({ access_token: 'access_token', refresh_token: 'refresh_token' });


      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockSignAuth.email }
      });
      expect(require('argon2').verify).toHaveBeenCalledWith(hashMock, mockSignAuth.password);
      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(authService.updateRtHash).toHaveBeenCalledWith(1, tokens.refresh_token);

    });
  });

  describe('Logout', () => {
    it('should update user hashRt to null', async () => {
      const mockUserId = 1
      jest.spyOn(mockPrismaService.user, 'updateMany').mockResolvedValueOnce({ count: 1 });
      const result = await authService.logout(mockUserId);
      expect(result).toBe(true);

      expect(mockPrismaService.user.updateMany).toHaveBeenCalledWith({
        where: { id: 1, hashRt: { not: null } },
        data: { hashRt: null },
      });
    });
  });

  describe('RefreshToken', () => {
    const mockUserId = 1;
    const mockRefreshToken = 'refresh_token';
    it('should throw if user not found', async () => {
      jest.spyOn(mockPrismaService.user, 'findUnique').mockResolvedValueOnce(null);
      await expect(authService.refreshToken(mockUserId, mockRefreshToken)).rejects.toThrow(new ForbiddenException('Access denied'));

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
      });
    });

    it('should throw if hashRt is missing', async () => {
      jest.spyOn(mockPrismaService.user, 'findUnique').mockResolvedValueOnce({ id: mockUserId, hashRt: null });
      await expect(authService.refreshToken(mockUserId, mockRefreshToken)).rejects.toThrow(new ForbiddenException('Access denied'));
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
      });
    });

    it('should throw if refresh token does not match', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce({ id: mockUserId, hashRt: mockRefreshToken });
      jest.spyOn(require('argon2'), 'verify').mockResolvedValueOnce(false);
      await expect(authService.refreshToken(mockUserId, mockRefreshToken)).rejects.toThrow(ForbiddenException);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
      });
      expect(require('argon2').verify).toHaveBeenCalledTimes(1);
      expect(require('argon2').verify).toHaveBeenCalledWith(mockRefreshToken, mockRefreshToken);
    });

    it('should return tokens if refresh token matches', async () => {
      const mockUserId = 1;
      const mockEmail = 'test@mail.com';
      const mockHashRt = 'hashed';
      const mockRefreshToken = 'rt';

      jest.spyOn(mockPrismaService.user, 'findUnique')
        .mockResolvedValueOnce({ id: mockUserId, email: mockEmail, hashRt: mockHashRt });
      jest.spyOn(require('argon2'), 'verify').mockResolvedValueOnce(true);
      mockJwtService.signAsync
        .mockResolvedValueOnce('access_token')
        .mockResolvedValueOnce('refresh_token');
      jest.spyOn(authService, 'updateRtHash').mockResolvedValueOnce(undefined as any);

      const tokens = await authService.refreshToken(mockUserId, mockRefreshToken);
      expect(tokens).toEqual({ access_token: 'access_token', refresh_token: 'refresh_token' });

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
      });
      expect(require('argon2').verify).toHaveBeenCalledWith(mockHashRt, mockRefreshToken);
      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(authService.updateRtHash).toHaveBeenCalledWith(mockUserId, 'refresh_token');
    });
  });
});