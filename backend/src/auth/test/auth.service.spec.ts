import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { EmailService } from '../../email/email.service';

describe('AuthService Tests', () => {
  let authService: AuthService;
  let emailService: EmailService;

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

  const mockEmailService = {
    sendEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    emailService = module.get<EmailService>(EmailService);

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
      jest.spyOn(mockPrismaService.user, 'findUnique').mockResolvedValueOnce({ id: 1, email: mockAuth.email });

      await expect(authService.signup(mockAuth)).rejects.toThrow(new ForbiddenException('User already exists'));

      expect(mockPrismaService.user.findUnique).toHaveBeenCalled();
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: {
          email: mockAuth.email,
        },
      });
    });

    it('should create a new user and return user id', async () => {
      jest.spyOn(mockPrismaService.user, 'findUnique').mockResolvedValueOnce(null);
      jest.spyOn(require('argon2'), 'hash').mockResolvedValueOnce('hashed_password');
      jest.spyOn(mockPrismaService.user, 'create').mockResolvedValueOnce({
        id: 1,
        email: 'test@mail.com',
        hash: 'hashed_password',
      });
      
      const result = await authService.signup(mockAuth);

      expect(result.userId).toEqual(1);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@mail.com' },
      });
      expect(require('argon2').hash).toHaveBeenCalledWith(mockAuth.password);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: mockAuth.email,
          hash: 'hashed_password',
        },
      });

    });
  });

  describe('Signin', () => {
    const mockSignAuth = {
      email: 'test@mail.com',
      password: 'pass',
    };
    it('should throw if user does not exist', async () => {
      jest.spyOn(mockPrismaService.user, 'findUnique').mockResolvedValueOnce(null);

      await expect(authService.signin(mockSignAuth)).rejects.toThrow(new ForbiddenException('Credentials incorrect'));

      expect(mockPrismaService.user.findUnique).toHaveBeenCalled();
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: {
          email: mockSignAuth.email,
        },
      });
    });

    const hashMock = 'hashed_password';
    it('should throw if password does not match', async () => {
      jest.spyOn(mockPrismaService.user, 'findUnique').mockResolvedValueOnce({
        id: 1,
        email: mockSignAuth.email,
        hash: hashMock,
      });
      jest.spyOn(require('argon2'), 'verify').mockResolvedValueOnce(false);
      await expect(authService.signin(mockSignAuth)).rejects.toThrow(new ForbiddenException('Access Deinied'));

      expect(mockPrismaService.user.findUnique).toHaveBeenCalled();
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: {
          email: mockSignAuth.email,
        },
      });
      expect(require('argon2').verify).toHaveBeenCalledWith(hashMock, mockSignAuth.password);
    });

    it('should return userId if credentials are correct', async () => {
      jest.spyOn(mockPrismaService.user, 'findUnique').mockResolvedValueOnce({
        id: 1,
        email: mockSignAuth.email,
        hash: hashMock,
      });
      jest.spyOn(require('argon2'), 'verify').mockResolvedValueOnce(true);
    
      const { userId } = await authService.signin(mockSignAuth);

      expect(userId).toEqual(1);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockSignAuth.email },
      });
      expect(require('argon2').verify).toHaveBeenCalledWith(hashMock, mockSignAuth.password);
    });
  });

  describe('VerifyOtp', () => {
    it('should throw if user does not exist', async () => {
      const userId = 1;
      const otpCode = '123456';

      jest.spyOn(mockPrismaService.user, 'findUnique').mockResolvedValueOnce(null);

      await expect(authService.verifyOtp({ userId, otpCode })).rejects.toThrow(new NotFoundException('User not found'));
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({ where: { id: userId } });
    });

    it('should throw if OTP data is missing (hashOtpCode or otpExpiresAt is null)', async () => {
      const userId = 1;
      const otpCode = '123456';
      const user = {
        id: userId,
        email: 'test@mail.com',
        hashOtpCode: null,
        otpExpiresAt: null,
      };

      jest.spyOn(mockPrismaService.user, 'findUnique').mockResolvedValueOnce(user);

      await expect(authService.verifyOtp({ userId, otpCode })).rejects.toThrow(
        new UnauthorizedException('Try to login first'),
      );
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({ where: { id: userId } });
    });

    it('should throw if OTP is invalid', async () => {
      const userId = 1;
      const otpCode = 'wrong';
      const user = {
        id: userId,
        email: 'test@mail.com',
        hashOtpCode: 'hashedOtp',
        otpExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
      };

      jest.spyOn(mockPrismaService.user, 'findUnique').mockResolvedValueOnce(user);
      jest.spyOn(require('argon2'), 'verify').mockResolvedValueOnce(false);

      await expect(authService.verifyOtp({ userId, otpCode })).rejects.toThrow(
        new UnauthorizedException('Invalid OTP code'),
      );
      expect(require('argon2').verify).toHaveBeenCalledWith(user.hashOtpCode, otpCode);
    });

    it('should throw if OTP is expired', async () => {
      const userId = 1;
      const otpCode = '123456';
      const expiredDate = new Date(Date.now() - 60 * 1000); // 1 minuto atrás
      const user = {
        id: userId,
        email: 'test@mail.com',
        hashOtpCode: 'hashedOtp',
        otpExpiresAt: expiredDate,
      };

      jest.spyOn(mockPrismaService.user, 'findUnique').mockResolvedValueOnce(user);
      jest.spyOn(require('argon2'), 'verify').mockResolvedValueOnce(true);
    
      await expect(authService.verifyOtp({ userId, otpCode })).rejects.toThrow(
        new UnauthorizedException('OTP code expired'),
      );
    });

    it('should validate OTP and return tokens', async () => {
      const userId = 1;
      const otpCode = '123456';
      const user = {
        id: userId,
        email: 'test@mail.com',
        hashOtpCode: 'hashedOtp',
        otpExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
      };
      const tokens = { access_token: 'at', refresh_token: 'rt' };

      jest.spyOn(mockPrismaService.user, 'findUnique').mockResolvedValueOnce(user);
      jest.spyOn(authService as any, 'getTokens').mockResolvedValueOnce(tokens);
      jest.spyOn(require('argon2'), 'verify').mockResolvedValueOnce(true);
    

      const result = await authService.verifyOtp({ userId, otpCode });
      expect(result).toEqual(tokens);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({ where: { id: userId } });
      expect(require('argon2').verify).toHaveBeenCalledWith(user.hashOtpCode, otpCode);
     
    });
  });

  describe('Logout', () => {
    it('should update user hashRt to null', async () => {
      const mockUserId = 1;
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
      await expect(authService.refreshToken(mockUserId, mockRefreshToken)).rejects.toThrow(
        new ForbiddenException('Access denied'),
      );

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
      });
    });

    it('should throw if hashRt is missing', async () => {
      jest.spyOn(mockPrismaService.user, 'findUnique').mockResolvedValueOnce({ id: mockUserId, hashRt: null });
      await expect(authService.refreshToken(mockUserId, mockRefreshToken)).rejects.toThrow(
        new ForbiddenException('Access denied'),
      );
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
      });
    });

    it('should throw if refresh token does not match', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: mockUserId,
        hashRt: mockRefreshToken,
      });
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

      jest.spyOn(mockPrismaService.user, 'findUnique').mockResolvedValueOnce({
        id: mockUserId,
        email: mockEmail,
        hashRt: mockHashRt,
      });
      jest.spyOn(require('argon2'), 'verify').mockResolvedValueOnce(true);
      mockJwtService.signAsync.mockResolvedValueOnce('access_token').mockResolvedValueOnce('refresh_token');

      const tokens = await authService.refreshToken(mockUserId, mockRefreshToken);
      expect(tokens).toEqual({
        access_token: 'access_token',
        refresh_token: 'refresh_token',
      });

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
      });
      expect(require('argon2').verify).toHaveBeenCalledWith(mockHashRt, mockRefreshToken);
      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2);
    });
  });
});
