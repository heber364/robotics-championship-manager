import { Photo } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class PhotoEntity implements Photo {
  @ApiProperty()
  id: number;

  @ApiProperty()
  url: string;

  @ApiProperty()
  caption: string;

  @ApiProperty()
  idMatch: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
