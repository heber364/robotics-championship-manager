import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, Min } from 'class-validator';

export enum TeamIdentifier {
  A = 'A',
  B = 'B',
}

export class UpdateMatchScoreDto {
  @ApiProperty({ enum: TeamIdentifier, example: TeamIdentifier.A })
  @IsEnum(TeamIdentifier)
  team: TeamIdentifier;

  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(0)
  score: number;
}
