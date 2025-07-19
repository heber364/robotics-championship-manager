import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePhotoDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  caption: string;
}