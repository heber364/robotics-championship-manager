import { IsEmail } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'User email',
    example: 'test@email.com',
    required: true,
    type: 'string',
  })
  @IsEmail()
  email: string;
}