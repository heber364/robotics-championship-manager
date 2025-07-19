import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto, UpdateCommentDto } from './dto';
import { GetCurrentUserId, Public, Roles } from 'src/common/decorators';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { Role } from 'src/common/enums';
import { CommentEntity } from './entities';

@ApiBearerAuth()
@Controller('matches/:idMatch/comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  @Roles(Role.JUDGE, Role.ASSISTANT)
  @ApiCreatedResponse({ type: CommentEntity })
  create(
    @Param('idMatch', ParseIntPipe) idMatch: number,
    @Body() createCommentDto: CreateCommentDto,
    @GetCurrentUserId() idUser: number,
  ) {
    return this.commentService.create(createCommentDto, idUser, idMatch);
  }

  @Get()
  @Public()
  @ApiOkResponse({ type: [CommentEntity] })
  findAllByMatch(@Param('idMatch', ParseIntPipe) idMatch: number) {
    return this.commentService.findAllByMatch(idMatch);
  }

  @Patch(':idComment')
  @Roles(Role.JUDGE, Role.ASSISTANT)
  @ApiOkResponse({ type: CommentEntity })
  update(
    @Param('idComment', ParseIntPipe) id: number,
    @Body() updateCommentDto: UpdateCommentDto,
    @GetCurrentUserId() idUser: number
  ) {
    return this.commentService.update(id, updateCommentDto, idUser);
  }

  @Delete(':idComment')
  @Roles(Role.JUDGE, Role.ASSISTANT)
  @ApiOkResponse()
  remove(@Param('idComment', ParseIntPipe) id: number, @GetCurrentUserId() idUser: number) {
    return this.commentService.remove(id, idUser);
  }
}
