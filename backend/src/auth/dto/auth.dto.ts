import { IsEmail, IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class AuthDto {
  @ApiProperty({
    description: 'User name',
    example: 'testuser',
    required: true,
    type: 'string',
  })
  @IsNotEmpty()
  @IsString()
  name: string;
  
  @ApiProperty({
    description: 'User email',
    example: 'test@email.com',
    required: true,
    type: 'string',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'password123',
    required: true,
    type: 'string',
  })
  @IsNotEmpty()
  @IsString()
  password: string;
}