import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto, UpdateCommentDto } from './dto';
import { GetCurrentUserId, Roles } from 'src/common/decorators';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Role } from 'src/common/enums';
import { RolesGuard } from 'src/common/guards';
import { CommentEntity } from './entities';

@ApiTags('comments')
@Controller('matches/:idMatch/comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  @Roles(Role.JUDGE, Role.ASSISTANT)
  @UseGuards(RolesGuard)
  @ApiCreatedResponse({ type: CommentEntity })
  create(
    @Param('idMatch', ParseIntPipe) idMatch: number,
    @Body() createCommentDto: CreateCommentDto,
    @GetCurrentUserId() idUser: number,
  ) {
    return this.commentService.create(createCommentDto, idUser, idMatch);
  }

  @Get()
  @ApiOkResponse({ type: [CommentEntity] })
  findAllByMatch(@Param('idMatch', ParseIntPipe) idMatch: number) {
    return this.commentService.findAllByMatch(idMatch);
  }

  @Patch(':idComment')
  @Roles(Role.JUDGE, Role.ASSISTANT)
  @UseGuards(RolesGuard)
  @ApiOkResponse({ type: CommentEntity })
  update(
    @Param('idComment', ParseIntPipe) id: number,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    return this.commentService.update(id, updateCommentDto);
  }

  @Delete(':idComment')
  @Roles(Role.JUDGE, Role.ASSISTANT)
  @UseGuards(RolesGuard)
  @ApiOkResponse()
  remove(@Param('idComment', ParseIntPipe) id: number) {
    return this.commentService.remove(id);
  }
}
