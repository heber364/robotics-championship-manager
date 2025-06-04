import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Hash otp code sent to user email',
    example: '$argon2id$v=19$m=65536,t=3,p=4$puAWVVt565xforKePskAmw$b0QRqS928DGktAsAYkyrCbz5jPPoRSdt5oZRHLJjsSM',
    required: true,
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  hashOtpCode: string;

  @ApiProperty({
    description: 'User new password',
    example: 'newPassword123',
    required: true,
    type: 'string',
  })
  @IsNotEmpty()
  @IsString()
  newPassword: string;
}
