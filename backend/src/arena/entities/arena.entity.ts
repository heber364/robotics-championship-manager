import { Arena } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class ArenaEntity implements Arena {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  youtubeLink: string;

  @ApiProperty()
  idCategory: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
