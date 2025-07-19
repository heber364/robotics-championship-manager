import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CommentGateway } from './comment.gateway';

@Injectable()
export class CommentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly commentGateway: CommentGateway,
  ) {}

  async create(createCommentDto: CreateCommentDto, idUser: number, idMatch: number) {
    const comment = await this.prisma.comment.create({
      data: {
        ...createCommentDto,
        idUser,
        idMatch,
      },
    });

    this.commentGateway.broadcastCommentCreated(idMatch, comment);
  }

  async findAllByMatch(idMatch: number) {
    return await this.prisma.comment.findMany({
      where: { idMatch },
    });
  }

  async update(id: number, updateCommentDto: UpdateCommentDto, idUser: number) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    if (comment.idUser !== idUser) {
      const user = await this.prisma.user.findUnique({
        where: { id: idUser },
      });

      if (user?.role !== 'SUPER_ADMIN') {
        throw new UnauthorizedException('You can only update your own comments');
      }
    }

    const updatedComment = await this.prisma.comment.update({
      where: { id },
      data: updateCommentDto,
    });

    this.commentGateway.broadcastCommentUpdate(updatedComment.idMatch, updatedComment);

    return updatedComment;
  }

  async remove(id: number, idUser: number) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.idUser !== idUser) {
      const user = await this.prisma.user.findUnique({
        where: { id: idUser },
      });

      if (user?.role !== 'SUPER_ADMIN') {
        throw new UnauthorizedException('You can only delete your own comments');
      }
    }

    const deletedComment = await this.prisma.comment.delete({
      where: { id },
    });
     this.commentGateway.broadcastCommentDeleted(deletedComment.idMatch, deletedComment);
    return true;
  }
}
