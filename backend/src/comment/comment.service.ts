import { Injectable } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CommentService {
  constructor(private readonly prisma: PrismaService) {}

  create(createCommentDto: CreateCommentDto, idUser: number, idMatch: number) {
    return this.prisma.comment.create({
      data: {
        ...createCommentDto,
        idUser,
        idMatch,
      },
    });
  }

  findAllByMatch(idMatch: number) {
    return this.prisma.comment.findMany({
      where: { idMatch },
    });
  }

  update(id: number, updateCommentDto: UpdateCommentDto) {
    return this.prisma.comment.update({
      where: { id },
      data: updateCommentDto,
    });
  }

  remove(id: number) {
    return this.prisma.comment.delete({
      where: { id },
    });
  }
}
