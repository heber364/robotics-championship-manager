import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MatchResult } from '../enums';

export class UpdateMatchResultDto {
  @ApiProperty({ enum: MatchResult })
  @IsEnum(MatchResult)
  result: MatchResult;
} 