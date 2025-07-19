import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class RequestEmailVerificationDto {
  @ApiProperty()
  @IsEmail()
  email: string;
}
