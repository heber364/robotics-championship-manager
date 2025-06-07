import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from './../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { EmailService } from './../email/email.service';

describe('AuthService Tests', () => {
  let authService: AuthService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
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

    jest.clearAllMocks();
  });

  it('Should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('Signup', () => {
    const mockAuth = {
      name: 'Test User',
      email: 'test@mail.com',
      password: 'pass',
    };

    it('should throw if user already exists', async () => {
      jest
        .spyOn(mockPrismaService.user, 'findUnique')
        .mockResolvedValueOnce({ id: 1, email: mockAuth.email });

      await expect(authService.signup(mockAuth)).rejects.toThrow(
        new ForbiddenException('User already exists'),
      );

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
        name: 'Test User',
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
          name: mockAuth.name,
          email: mockAuth.email,
          hash: 'hashed_password',
        },
      });
    });
  });

  describe('Signin', () => {
    const mockSignAuth = {
      name: 'Test User',
      email: 'test@mail.com',
      password: 'pass',
    };
    it('should throw if user does not exist', async () => {
      jest.spyOn(mockPrismaService.user, 'findUnique').mockResolvedValueOnce(null);

      await expect(authService.signin(mockSignAuth)).rejects.toThrow(
        new ForbiddenException('Credentials incorrect'),
      );

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
      await expect(authService.signin(mockSignAuth)).rejects.toThrow(
        new ForbiddenException('Access Deinied'),
      );

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

      mockJwtService.signAsync
        .mockResolvedValueOnce('access_token')
        .mockResolvedValueOnce('refresh_token');

      const { access_token, refresh_token } = await authService.signin(mockSignAuth);

      expect(access_token).toEqual('access_token');
      expect(refresh_token).toEqual('refresh_token');
    });
  });

  describe('VerifyOtp', () => {
    it('should throw if user does not exist', async () => {
      const userId = 1;
      const otpCode = '123456';

      jest.spyOn(mockPrismaService.user, 'findUnique').mockResolvedValueOnce(null);

      await expect(authService.verifyOtp({ userId, otpCode })).rejects.toThrow(
        new NotFoundException('User not found'),
      );
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
      jest
        .spyOn(mockPrismaService.user, 'findUnique')
        .mockResolvedValueOnce({ id: mockUserId, hashRt: null });
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
      await expect(authService.refreshToken(mockUserId, mockRefreshToken)).rejects.toThrow(
        ForbiddenException,
      );

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
      mockJwtService.signAsync
        .mockResolvedValueOnce('access_token')
        .mockResolvedValueOnce('refresh_token');

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

  describe('ChangePassword', () => {
    const mockUserId = 1;
    const mockChangePasswordDto = {
      oldPassword: 'oldPass',
      newPassword: 'newPass',
    };
    it('should throw if user not found', async () => {
      jest.spyOn(mockPrismaService.user, 'findUnique').mockResolvedValueOnce(null);
      await expect(authService.changePassword(mockUserId, mockChangePasswordDto)).rejects.toThrow(
        new NotFoundException('User not found'),
      );

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
      });
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should throw if old password does not match', async () => {
      jest.spyOn(mockPrismaService.user, 'findUnique').mockResolvedValueOnce({
        id: mockUserId,
        hash: 'hashed_old_password',
      });
      jest.spyOn(require('argon2'), 'verify').mockResolvedValueOnce(false);

      await expect(authService.changePassword(mockUserId, mockChangePasswordDto)).rejects.toThrow(
        new UnauthorizedException('Old password is incorrect'),
      );

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
      });
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledTimes(1);
      expect(require('argon2').verify).toHaveBeenCalledWith(
        'hashed_old_password',
        mockChangePasswordDto.oldPassword,
      );
    });
    it('should change password successfully', async () => {
      jest.spyOn(mockPrismaService.user, 'findUnique').mockResolvedValueOnce({
        id: mockUserId,
        hash: 'hashed_old_password',
      });
      jest.spyOn(require('argon2'), 'verify').mockResolvedValueOnce(true);
      jest.spyOn(require('argon2'), 'hash').mockResolvedValueOnce('new_hashed_password');

      await authService.changePassword(mockUserId, mockChangePasswordDto);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
      });
      expect(require('argon2').verify).toHaveBeenCalledWith(
        'hashed_old_password',
        mockChangePasswordDto.oldPassword,
      );
      expect(require('argon2').hash).toHaveBeenCalledWith(mockChangePasswordDto.newPassword);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: { hash: 'new_hashed_password' },
      });
    });
  });

  describe('ForgotPassword', () => {
    const mockEmail = '';
    const mockUser = {
      id: 1,
      email: mockEmail,
      hashOtpCode: 'hashedOtp',
      otpExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
    };
    it('should throw if user does not exist', async () => {
      jest.spyOn(mockPrismaService.user, 'findUnique').mockResolvedValueOnce(null);

      await expect(authService.forgotPassword({ email: mockEmail })).rejects.toThrow(
        new ForbiddenException('Credentials incorrect'),
      );

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockEmail },
      });
    });
    it('should generate OTP code and send email', async () => {
      jest.spyOn(mockPrismaService.user, 'findUnique').mockResolvedValueOnce(mockUser);
      jest.spyOn(authService as any, 'generateOtpCode').mockResolvedValueOnce({
        hashOtpCode: 'hashedOtp',
        otpCode: 'otpCode',
      });
      jest.spyOn(authService as any, 'sendHashOtpCodeToEmail');

      await authService.forgotPassword({ email: mockEmail });

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockEmail },
      });
      expect(authService['generateOtpCode']).toHaveBeenCalledWith(mockUser.id);
      expect(authService['sendHashOtpCodeToEmail']).toHaveBeenCalledWith('hashedOtp', mockEmail);
    });
  });

  describe('ResetPassword', () => {

    const mockResetPasswordDto = {
      hashOtpCode: 'hashedOtp',
      newPassword: 'newPass',
    };
    it('should throw if user not found or OTP expired', async () => {
      jest.spyOn(mockPrismaService.user, 'findFirst').mockResolvedValueOnce(null);

      await expect(authService.resetPassword(mockResetPasswordDto)).rejects.toThrow(
        new UnauthorizedException('Invalid or expired OTP code'),
      );

      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          hashOtpCode: mockResetPasswordDto.hashOtpCode,
          otpExpiresAt: { gte: new Date },
        },
      });
    });
    it('should reset password successfully', async () => {
      const mockUser = {
        id: 1,
      };
      const fixedDate = new Date('2025-06-07T16:10:52.252Z');

      jest.spyOn(global, 'Date').mockImplementation(() => fixedDate);
      mockPrismaService.user.findFirst.mockResolvedValueOnce(mockUser);
      jest.spyOn(require('argon2'), 'hash').mockResolvedValueOnce('new_hashed_password');

      await authService.resetPassword(mockResetPasswordDto);

      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          hashOtpCode: mockResetPasswordDto.hashOtpCode,
          otpExpiresAt: { gte: fixedDate },
        },
      });
      expect(require('argon2').hash).toHaveBeenCalledWith(mockResetPasswordDto.newPassword);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          hash: 'new_hashed_password',
          hashOtpCode: null,
          otpExpiresAt: null,
        },
      });
    });
  });
});
