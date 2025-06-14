import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  token: string;
} 