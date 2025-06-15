import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from './../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { EmailService } from './../email/email.service';
import { VerifyEmailDto } from './dto';

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
    get: jest.fn((key: string): string => {
      const config: Record<string, string> = {
        AT_EXPIRATION_TIME: '60s',
        AT_SECRET: 'at-secret',
        RT_EXPIRATION_TIME: '7d',
        RT_SECRET: 'rt-secret',
        FRONTEND_URL: 'http://localhost:3000',
      };
      return config[key] || '';
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
      jest.spyOn(await import('argon2'), 'hash').mockResolvedValueOnce('hashed_password');
      jest.spyOn(mockPrismaService.user, 'create').mockResolvedValueOnce({
        id: 1,
        name: 'Test User',
        email: 'test@mail.com',
        hash: 'hashed_password',
      });
      jest
        .spyOn(authService as any, 'generateVerificationToken')
        .mockResolvedValueOnce('test-token');
      jest.spyOn(authService as any, 'sendVerificationEmail').mockResolvedValueOnce(undefined);

      const result = await authService.signup(mockAuth);

      expect(result.userId).toEqual(1);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@mail.com' },
      });
      expect((await import('argon2')).hash).toHaveBeenCalledWith(mockAuth.password);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          name: mockAuth.name,
          email: mockAuth.email,
          hash: 'hashed_password',
        },
      });
      expect(authService['generateVerificationToken']).toHaveBeenCalledWith(1);
      expect(authService['sendVerificationEmail']).toHaveBeenCalledWith(
        'test-token',
        mockAuth.email,
      );
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
        emailVerified: true,
      });
      jest.spyOn(await import('argon2'), 'verify').mockResolvedValueOnce(false);
      await expect(authService.signin(mockSignAuth)).rejects.toThrow(
        new ForbiddenException('Access Denied'),
      );

      expect(mockPrismaService.user.findUnique).toHaveBeenCalled();
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: {
          email: mockSignAuth.email,
        },
      });
      expect((await import('argon2')).verify).toHaveBeenCalledWith(hashMock, mockSignAuth.password);
    });

    it('should throw if email is not verified', async () => {
      jest.spyOn(mockPrismaService.user, 'findUnique').mockResolvedValueOnce({
        id: 1,
        email: mockSignAuth.email,
        hash: hashMock,
        emailVerified: false,
      });
      jest.spyOn(await import('argon2'), 'verify').mockResolvedValueOnce(true);

      await expect(authService.signin(mockSignAuth)).rejects.toThrow(
        new ForbiddenException('Please verify your email before logging in'),
      );
    });

    it('should return tokens if credentials are correct', async () => {
      jest.spyOn(mockPrismaService.user, 'findUnique').mockResolvedValueOnce({
        id: 1,
        email: mockSignAuth.email,
        hash: hashMock,
        emailVerified: true,
        role: 'USER',
      });
      jest.spyOn(await import('argon2'), 'verify').mockResolvedValueOnce(true);

      mockJwtService.signAsync
        .mockResolvedValueOnce('access_token')
        .mockResolvedValueOnce('refresh_token');

      const { access_token, refresh_token } = await authService.signin(mockSignAuth);

      expect(access_token).toEqual('access_token');
      expect(refresh_token).toEqual('refresh_token');
    });
  });

  describe('VerifyEmail', () => {
    const verifyEmailDto: VerifyEmailDto = {
      token: 'test-token',
    };

    it('should throw if token is invalid or expired', async () => {
      jest.spyOn(mockPrismaService.user, 'findFirst').mockResolvedValueOnce(null);

      await expect(authService.verifyEmail(verifyEmailDto)).rejects.toThrow(
        new UnauthorizedException('Invalid or expired verification token'),
      );

      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          emailVerificationToken: verifyEmailDto.token,
          emailVerificationTokenExpiresAt: {
            gt: expect.any(Date) as Date,
          },
        },
      });
    });

    it('should verify email and return tokens', async () => {
      const user = {
        id: 1,
        email: 'test@mail.com',
        role: 'USER',
      };
      const tokens = { access_token: 'at', refresh_token: 'rt' };

      jest.spyOn(mockPrismaService.user, 'findFirst').mockResolvedValueOnce(user);
      jest.spyOn(mockPrismaService.user, 'update').mockResolvedValueOnce({
        ...user,
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationTokenExpiresAt: null,
      });
      jest.spyOn(authService as any, 'getTokens').mockResolvedValueOnce(tokens);
      jest.spyOn(authService as any, 'updateRtHash').mockResolvedValueOnce(undefined);

      const result = await authService.verifyEmail(verifyEmailDto);

      expect(result).toEqual(tokens);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: user.id },
        data: {
          emailVerified: true,
          emailVerificationToken: null,
          emailVerificationTokenExpiresAt: null,
        },
      });
      expect(authService['getTokens']).toHaveBeenCalledWith(user.id, user.email, user.role);
      expect(authService['updateRtHash']).toHaveBeenCalledWith(user.id, tokens.refresh_token);
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
        new ForbiddenException('Access Denied'),
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
        new ForbiddenException('Access Denied'),
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
      jest.spyOn(await import('argon2'), 'verify').mockResolvedValueOnce(false);
      await expect(authService.refreshToken(mockUserId, mockRefreshToken)).rejects.toThrow(
        ForbiddenException,
      );

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
      });
      expect((await import('argon2')).verify).toHaveBeenCalledTimes(1);
      expect((await import('argon2')).verify).toHaveBeenCalledWith(
        mockRefreshToken,
        mockRefreshToken,
      );
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
        role: 'USER',
      });
      jest.spyOn(await import('argon2'), 'verify').mockResolvedValueOnce(true);
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
      expect((await import('argon2')).verify).toHaveBeenCalledWith(mockHashRt, mockRefreshToken);
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
      jest.spyOn(await import('argon2'), 'verify').mockResolvedValueOnce(false);

      await expect(authService.changePassword(mockUserId, mockChangePasswordDto)).rejects.toThrow(
        new UnauthorizedException('Access Denied'),
      );

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
      });
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledTimes(1);
      expect((await import('argon2')).verify).toHaveBeenCalledWith(
        'hashed_old_password',
        mockChangePasswordDto.oldPassword,
      );
    });
    it('should change password successfully', async () => {
      jest.spyOn(mockPrismaService.user, 'findUnique').mockResolvedValueOnce({
        id: mockUserId,
        hash: 'hashed_old_password',
      });
      jest.spyOn(await import('argon2'), 'verify').mockResolvedValueOnce(true);
      jest.spyOn(await import('argon2'), 'hash').mockResolvedValueOnce('new_hashed_password');

      await authService.changePassword(mockUserId, mockChangePasswordDto);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
      });
      expect((await import('argon2')).verify).toHaveBeenCalledWith(
        'hashed_old_password',
        mockChangePasswordDto.oldPassword,
      );
      expect((await import('argon2')).hash).toHaveBeenCalledWith(mockChangePasswordDto.newPassword);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: { hash: 'new_hashed_password' },
      });
    });
  });

  describe('ForgotPassword', () => {
    const mockEmail = 'test@mail.com';
    const mockUser = {
      id: 1,
      email: mockEmail,
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

    it('should generate verification token and send email', async () => {
      jest.spyOn(mockPrismaService.user, 'findUnique').mockResolvedValueOnce(mockUser);
      jest
        .spyOn(authService as any, 'generateVerificationToken')
        .mockResolvedValueOnce('test-token');
      jest.spyOn(authService as any, 'sendVerificationEmail').mockResolvedValueOnce(undefined);

      await authService.forgotPassword({ email: mockEmail });

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockEmail },
      });
      expect(authService['generateVerificationToken']).toHaveBeenCalledWith(mockUser.id);
      expect(authService['sendVerificationEmail']).toHaveBeenCalledWith('test-token', mockEmail);
    });
  });

  describe('ResetPassword', () => {
    const mockResetPasswordDto = {
      token: 'test-token',
      newPassword: 'newPassword123',
    };

    it('should throw if token is invalid or expired', async () => {
      jest.spyOn(mockPrismaService.user, 'findFirst').mockResolvedValueOnce(null);

      await expect(authService.resetPassword(mockResetPasswordDto)).rejects.toThrow(
        new UnauthorizedException('Invalid or expired verification token'),
      );

      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          emailVerificationToken: mockResetPasswordDto.token,
          emailVerificationTokenExpiresAt: {
            gt: expect.any(Date) as Date,
          },
        },
      });
    });

    it('should reset password successfully', async () => {
      const mockUser = {
        id: 1,
      };

      jest.spyOn(mockPrismaService.user, 'findFirst').mockResolvedValueOnce(mockUser);
      jest.spyOn(await import('argon2'), 'hash').mockResolvedValueOnce('new_hashed_password');

      await authService.resetPassword(mockResetPasswordDto);

      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          emailVerificationToken: mockResetPasswordDto.token,
          emailVerificationTokenExpiresAt: {
            gt: expect.any(Date) as Date,
          },
        },
      });
      expect((await import('argon2')).hash).toHaveBeenCalledWith(mockResetPasswordDto.newPassword);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          hash: 'new_hashed_password',
          emailVerificationToken: null,
          emailVerificationTokenExpiresAt: null,
        },
      });
    });
  });
});
