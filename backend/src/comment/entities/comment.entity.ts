import { ApiProperty } from '@nestjs/swagger';
import { Comment } from '@prisma/client';

export class CommentEntity implements Comment {
  @ApiProperty()
  id: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  content: string;

  @ApiProperty()
  idMatch: number;

  @ApiProperty()
  idUser: number;
}
