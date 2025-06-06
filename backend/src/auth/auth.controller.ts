import { Body, Controller, HttpCode, HttpStatus, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto';
import { Tokens } from './types';
import { AtGuard, RtGuard } from '../common/guards';
import { GetCurrentUser, GetCurrentUserId, Public } from '../common/decorators';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ChangePasswordDto } from './dto/change-password';
import { ForgotPasswordDto } from './dto/forgot-password';
import { ResetPasswordDto } from './dto/reset-password';

@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    schema: {
      example: {
        userId: 1,
      },
    },
  })
  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() dto: AuthDto): Promise<{ userId: number }> {
    return this.authService.signup(dto);
  }

  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    schema: {
      example: {
        userId: 1,
      },
    },
  })
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('signin')
  async signin(@Body() dto: AuthDto): Promise<Tokens> {
    return this.authService.signin(dto);
  }

  @ApiResponse({
    status: 200,
    description: 'OTP verified and tokens returned',
    schema: {
      example: { access_token: '...', refresh_token: '...' },
    },
  })
  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() dto: VerifyOtpDto): Promise<Tokens> {
    return this.authService.verifyOtp(dto);
  }

  @ApiResponse({
    status: 200,
    description: 'User logged out successfully',
    schema: {
      example: true,
    },
  })
  @UseGuards(AtGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@GetCurrentUserId() userId: number): Promise<boolean> {
    return this.authService.logout(userId);
  }

  @ApiResponse({
    status: 200,
    description: 'Tokens refreshed successfully',
    schema: {
      example: { access_token: '...', refresh_token: '...' },
    },
  })
  @Public()
  @UseGuards(RtGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @GetCurrentUserId() userId: number,
    @GetCurrentUser('refreshToken')
    refreshToken: string,
  ): Promise<Tokens> {
    return this.authService.refreshToken(userId, refreshToken);
  }

  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
  })
  @UseGuards(AtGuard)
  @Patch('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @GetCurrentUserId() userId: number,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    return this.authService.changePassword(userId, dto);
  }

  @ApiResponse({
    status: 200,
    description: 'Password reset code sent successfully',
  })
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<void> {
    return this.authService.forgotPassword(dto);
  }

  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
  })
  @Public()
  @Patch('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    return this.authService.resetPassword(dto);
  }
}
