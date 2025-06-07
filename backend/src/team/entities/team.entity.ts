import { Team } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class TeamEntity implements Team {
  @ApiProperty()
  name: string;

  @ApiProperty()
  id: number;

  @ApiProperty()
  robotName: string;

  @ApiProperty()
  idCategory: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
