import { Match, MatchResult } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { MatchStatus } from '../enums';

export class MatchEntity implements Match {
  @ApiProperty()
  id: number;

  @ApiProperty()
  idTeamA: number;

  @ApiProperty()
  idTeamB: number;

  @ApiProperty()
  idArena: number;

  @ApiProperty()
  date: Date;

  @ApiProperty({ enum: MatchStatus })
  status: MatchStatus;

  @ApiProperty({ nullable: true })
  startTime: Date | null;

  @ApiProperty({ nullable: true })
  endTime: Date | null;

  @ApiProperty({ nullable: true })
  observation: string | null;

  @ApiProperty({ enum: MatchResult, nullable: true })
  matchResult: MatchResult | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
