import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ResetPasswordDto, SignUpDto, VerifyEmailDto } from './dto';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    signup: jest.fn(),
    signin: jest.fn(),
    logout: jest.fn(),
    refreshToken: jest.fn(),
    verifyEmail: jest.fn(),
    changePassword: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Signup', () => {
    it('should call authService.signup and return tokens', async () => {
      const signupDto: SignUpDto = {
        name: 'Test name',
        email: 'test@mail.com',
        password: 'pass',
      };

      mockAuthService.signup.mockResolvedValueOnce({ userId: 1 });

      const result = await controller.signup(signupDto);

      expect(result).toEqual({ userId: 1 });
      expect(mockAuthService.signup).toHaveBeenCalledWith(signupDto);
    });
  });

  describe('Signin', () => {
    it('should call authService.signin and return tokens', async () => {
      const signInDto = { email: 'test@mail.com', password: 'pass' };
      const tokens = { access_token: 'at', refresh_token: 'rt' };
      mockAuthService.signin.mockResolvedValueOnce(tokens);

      const result = await controller.signin(signInDto);

      expect(result).toEqual(tokens);
      expect(mockAuthService.signin).toHaveBeenCalledWith(signInDto);
    });
  });

  describe('VerifyOtp', () => {
    it('should call authService.verifyEmail and return tokens', async () => {
      const verifyOtpDto: VerifyEmailDto = {
        token: 'test-token',
      };
      const tokens = { access_token: 'at', refresh_token: 'rt' };
      mockAuthService.verifyEmail = jest.fn().mockResolvedValueOnce(tokens);

      const result = await controller.verifyEmail(verifyOtpDto);

      expect(result).toEqual(tokens);
      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith(verifyOtpDto);
    });
  });

  describe('Logout', () => {
    it('should call authService.logout and return true', async () => {
      mockAuthService.logout.mockResolvedValueOnce(true);

      const result = await controller.logout(1);

      expect(result).toBe(true);
      expect(mockAuthService.logout).toHaveBeenCalledWith(1);
    });
  });

  describe('RefreshToken', () => {
    it('should call authService.refreshToken and return tokens', async () => {
      const dto = { userId: 1, refreshToken: 'rt' };
      const tokens = { access_token: 'at', refresh_token: 'rt' };
      mockAuthService.refreshToken.mockResolvedValueOnce(tokens);

      const result = await controller.refreshToken(dto.userId, dto.refreshToken);

      expect(result).toEqual(tokens);
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(dto.userId, dto.refreshToken);
    });
  });

  describe('ChangePassword', () => {
    it('should call authService.changePassword', async () => {
      const changePasswordDto = { oldPassword: 'old', newPassword: 'new' };

      mockAuthService.changePassword.mockResolvedValueOnce(undefined);

      await controller.changePassword(1, changePasswordDto);

      expect(mockAuthService.changePassword).toHaveBeenCalledWith(1, changePasswordDto);
    });
  });

  describe('ForgotPassword', () => {
    it('should call authService.forgotPassword', async () => {
      const forgotPasswordDto = { email: '' };

      mockAuthService.forgotPassword.mockResolvedValueOnce(undefined);
      await controller.forgotPassword(forgotPasswordDto);
      expect(mockAuthService.forgotPassword).toHaveBeenCalledWith(forgotPasswordDto);
      expect(mockAuthService.forgotPassword).toHaveBeenCalledTimes(1);
    });
  });

  describe('Reset ', () => {
    it('should call authService.resetPassword', async () => {
      const resetPasswordDto: ResetPasswordDto = {
        newPassword: 'newPassword123',
        token: 'test-token',
      };

      mockAuthService.resetPassword.mockResolvedValueOnce(undefined);
      await controller.resetPassword(resetPasswordDto);
      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(resetPasswordDto);
      expect(mockAuthService.resetPassword).toHaveBeenCalledTimes(1);
    });
  });
});
