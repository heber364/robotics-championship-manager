import { Body, Controller, HttpCode, HttpStatus, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  SignUpDto,
  SignInDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyOtpDto,
} from './dto';
import { Tokens } from './types';
import { AtGuard, RtGuard } from '../common/guards';
import { GetCurrentUser, GetCurrentUserId, Public } from '../common/decorators';

import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';

@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse()
  async signup(@Body() signUpDto: SignUpDto): Promise<{ userId: number }> {
    return this.authService.signup(signUpDto);
  }

  @Post('signin')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse()
  async signin(@Body() siginDto: SignInDto): Promise<Tokens> {
    return this.authService.signin(siginDto);
  }

  @Post('verify-email')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse()
  async verifyOtp(@Body() dto: VerifyOtpDto): Promise<Tokens> {
    return this.authService.verifyOtp(dto);
  }

  @Post('logout')
  @UseGuards(AtGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse()
  async logout(@GetCurrentUserId() userId: number): Promise<boolean> {
    return this.authService.logout(userId);
  }

  @Post('refresh')
  @Public()
  @UseGuards(RtGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse()
  async refreshToken(
    @GetCurrentUserId() userId: number,
    @GetCurrentUser('refreshToken')
    refreshToken: string,
  ): Promise<Tokens> {
    return this.authService.refreshToken(userId, refreshToken);
  }

  @Patch('change-password')
  @UseGuards(AtGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse()
  async changePassword(
    @GetCurrentUserId() userId: number,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    return this.authService.changePassword(userId, dto);
  }

  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse()
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<void> {
    return this.authService.forgotPassword(dto);
  }

  @Patch('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse()
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    return this.authService.resetPassword(dto);
  }
}
