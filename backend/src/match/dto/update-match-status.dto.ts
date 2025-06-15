import { IsEnum } from 'class-validator';
import { MatchStatus } from '@prisma/client';

export class UpdateMatchStatusDto {
  @IsEnum(MatchStatus)
  status: MatchStatus;
}
