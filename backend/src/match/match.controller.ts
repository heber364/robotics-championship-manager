import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { MatchService } from './match.service';
import { CreateMatchDto, UpdateMatchDto, UpdateMatchResultDto } from './dto';
import { ApiOkResponse, ApiCreatedResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MatchEntity } from './entities/match.entity';
import { Roles } from '../common/decorators';
import { Role } from '../common/enums';

@ApiBearerAuth()
@Controller('matches')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
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
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOkResponse({ type: MatchEntity })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateMatchDto: UpdateMatchDto) {
    return this.matchService.update(id, updateMatchDto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOkResponse({ type: Boolean })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.matchService.remove(id);
  }

  @Post(':id/start')
  @Roles(Role.JUDGE)
  startMatch(@Param('id', ParseIntPipe) id: number) {
    return this.matchService.startMatch(id);
  }

  @Post(':id/pause')
  @Roles(Role.JUDGE)
  pauseMatch(@Param('id', ParseIntPipe) id: number) {
    return this.matchService.pauseMatch(id);
  }

  @Post(':id/end')
  @Roles(Role.JUDGE)
  endMatch(@Param('id', ParseIntPipe) id: number) {
    return this.matchService.endMatch(id);
  }

  @Patch(':id/result')
  @Roles(Role.JUDGE)
  @ApiOkResponse({ type: MatchEntity })
  updateMatchResult(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMatchResultDto: UpdateMatchResultDto,
  ) {
    return this.matchService.updateMatchResult(id, updateMatchResultDto);
  }
}
