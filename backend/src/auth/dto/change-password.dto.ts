import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  oldPassword: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  newPassword: string;
}
