import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  hashOtpCode: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  newPassword: string;
}
