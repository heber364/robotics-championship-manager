import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    signup: jest.fn(),
    signin: jest.fn(),
    logout: jest.fn(),
    refreshToken: jest.fn(),
    verifyOtp: jest.fn(),
  };
  

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Signup', () => {
    it('should call authService.signup and return tokens', async () => {
      const dto = { name: "Test name", email: 'test@mail.com', password: 'pass' };
      const userId = 1;
      mockAuthService.signup.mockResolvedValueOnce({userId: userId});

      const result = await controller.signup(dto);

      expect(authService.signup).toHaveBeenCalledWith(dto);
      expect(result).toEqual({userId: userId});
    });
  });

  describe('Signin', () => {
    it('should call authService.signin and return tokens', async () => {
      const dto = {  name: "Test name", email: 'test@mail.com', password: 'pass' };
      const tokens = { access_token: 'at', refresh_token: 'rt' };
      mockAuthService.signin.mockResolvedValueOnce(tokens);

      const result = await controller.signin(dto);

      expect(authService.signin).toHaveBeenCalledWith(dto);
      expect(result).toEqual(tokens);
    });
  });

  describe('VerifyOtp', () => {
  it('should call authService.verifyOtp and return tokens', async () => {
    const dto = { userId: 1, otpCode: '123456' };
    const tokens = { access_token: 'at', refresh_token: 'rt' };
    mockAuthService.verifyOtp = jest.fn().mockResolvedValueOnce(tokens);

    const result = await controller.verifyOtp(dto);

    expect(authService.verifyOtp).toHaveBeenCalledWith(dto);
    expect(result).toEqual(tokens);
  });
});

  describe('Logout', () => {
    it('should call authService.logout and return true', async () => {
      mockAuthService.logout.mockResolvedValueOnce(true);

      const userId = 1;
      const result = await controller.logout(userId);

      expect(authService.logout).toHaveBeenCalledWith(userId);
      expect(result).toBe(true);
    });
  });

  describe('RefreshToken', () => {
    it('should call authService.refreshToken and return tokens', async () => {
      const dto = { userId: 1, refreshToken: 'rt' };
      const tokens = { access_token: 'at', refresh_token: 'rt' };
      mockAuthService.refreshToken.mockResolvedValueOnce(tokens);

      const result = await controller.refreshToken(dto.userId, dto.refreshToken);

      expect(authService.refreshToken).toHaveBeenCalledWith(dto.userId, dto.refreshToken);
      expect(result).toEqual(tokens);
    });
  });
});