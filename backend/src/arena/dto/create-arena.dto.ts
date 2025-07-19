import { IsNotEmpty, IsString, IsNumber, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateArenaDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  name: string;

  @IsString()
  @IsUrl()
  @IsNotEmpty()
  @ApiProperty()
  youtubeLink: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  idCategory: number;
}
