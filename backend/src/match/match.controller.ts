import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { MatchService } from './match.service';
import { CreateMatchDto, UpdateMatchDto, UpdateMatchScoreDto } from './dto';
import { ApiOkResponse, ApiCreatedResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MatchEntity } from './entities/match.entity';
import { GetCurrentUserId, Public, Roles } from '../common/decorators';
import { Role } from '../common/enums';
import { Express } from 'express';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ImageFileValidationPipe } from 'src/common/validators';

@ApiBearerAuth()
@Controller('matches')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiCreatedResponse({ type: MatchEntity })
  create(@Body() createMatchDto: CreateMatchDto) {
    return this.matchService.create(createMatchDto);
  }

  @Get()
  @ApiOkResponse({ type: [MatchEntity] })
  findAll() {
    return this.matchService.findAll();
  }

  @Get(':id')
  @ApiOkResponse({ type: MatchEntity })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.matchService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOkResponse({ type: MatchEntity })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateMatchDto: UpdateMatchDto) {
    return this.matchService.update(id, updateMatchDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOkResponse({ type: Boolean })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.matchService.remove(id);
  }

  @Post(':id/start')
  @Roles(Role.JUDGE)
  startMatch(@Param('id', ParseIntPipe) id: number, @GetCurrentUserId() userId: number) {
    return this.matchService.startMatch(id, userId);
  }

  @Post(':id/pause')
  @Roles(Role.JUDGE)
  pauseMatch(@Param('id', ParseIntPipe) id: number, @GetCurrentUserId() userId: number) {
    return this.matchService.pauseMatch(id, userId);
  }

  @Post(':id/end')
  @Roles(Role.JUDGE)
  endMatch(@Param('id', ParseIntPipe) id: number, @GetCurrentUserId() userId: number) {
    return this.matchService.endMatch(id, userId);
  }

  @Patch(':id/score')
  @Roles(Role.JUDGE)
  @ApiOkResponse({ type: MatchEntity })
  updateMatchScore(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMatchScoreDto: UpdateMatchScoreDto,
    @GetCurrentUserId() userId: number,
  ) {
    return this.matchService.updateMatchScore(id, updateMatchScoreDto, userId);
  }

}
