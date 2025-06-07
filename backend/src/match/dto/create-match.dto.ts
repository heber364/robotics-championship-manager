import { IsNotEmpty, IsNumber, IsString, IsDate, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MatchResult } from '@prisma/client';
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
  @IsNotEmpty()
  @ApiProperty()
  status: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  observation?: string;

  @IsEnum(MatchResult)
  @IsOptional()
  @ApiProperty({ enum: MatchResult, required: false })
  matchResult?: MatchResult;
}
