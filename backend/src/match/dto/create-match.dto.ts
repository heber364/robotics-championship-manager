import { IsNotEmpty, IsNumber, IsString, IsDate, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateMatchDto {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  idTeamA: number;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  idTeamB: number;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  idArena: number;

  @IsDate()
  @Type(() => Date)
  @ApiProperty()
  date: Date;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  observation?: string;
}
