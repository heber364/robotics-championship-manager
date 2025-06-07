import { Match, MatchResult } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty()
  status: string;

  @ApiProperty({ required: false })
  observation: string | null;

  @ApiProperty({ enum: MatchResult, required: false })
  matchResult: MatchResult | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
