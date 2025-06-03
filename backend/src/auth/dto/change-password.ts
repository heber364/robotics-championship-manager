import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'User old password',
    example: 'oldPassword123',
    required: true,
    type: 'string',
  })
  @IsNotEmpty()
  @IsString()
  oldPassword: string;

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