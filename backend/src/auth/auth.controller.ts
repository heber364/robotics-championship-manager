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
import { RtGuard } from '../common/guards';
import { GetCurrentUser, GetCurrentUserId, Public } from '../common/decorators';

import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { User } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  @Public()
  @ApiCreatedResponse()
  async signup(@Body() signUpDto: SignUpDto): Promise<{ userId: number }> {
    return this.authService.signup(signUpDto);
  }

  @Post('signin')
  @Public()
  @ApiOkResponse()
  async signin(@Body() siginDto: SignInDto): Promise<Tokens> {
    return this.authService.signin(siginDto);
  }

  @Post('verify-email')
  @Public()
  @ApiOkResponse()
  async verifyOtp(@Body() dto: VerifyOtpDto): Promise<Tokens> {
    return this.authService.verifyOtp(dto);
  }

  @Post('logout')
  @ApiBearerAuth()
  @ApiOkResponse()
  async logout(@GetCurrentUserId() userId: number, @GetCurrentUser() user: User): Promise<boolean> {
    console.log(user)
    return this.authService.logout(userId);
  }

  @Post('refresh')
  @Public()
  @UseGuards(RtGuard)
  @ApiOkResponse()
  async refreshToken(
    @GetCurrentUserId() userId: number,
    @GetCurrentUser('refreshToken')
    refreshToken: string,
  ): Promise<Tokens> {
    return this.authService.refreshToken(userId, refreshToken);
  }

  @Patch('change-password')
  @ApiBearerAuth()
  @ApiOkResponse()
  async changePassword(
    @GetCurrentUserId() userId: number,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    return this.authService.changePassword(userId, dto);
  }

  @Post('forgot-password')
  @Public()
  @ApiOkResponse()
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<void> {
    return this.authService.forgotPassword(dto);
  }

  @Patch('reset-password')
  @Public()
  @ApiOkResponse()
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    return this.authService.resetPassword(dto);
  }
}
